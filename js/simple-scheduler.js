"use strict";
var sScheduler = function(selector,options){
    var self = this;
    var dateTimeFormat = "YYYY-MM-DD HH:mm";
    var dateFormat = "YYYY-MM-DD";
    /**
     * Default settings
     */
    var settings=$.extend({
        titles:[],
        startDate:null,//"2015-09-21",
        keyName:'id',
        source:function(request,callback){ }, //ajax to get events collection
        celInterval:50, // minutes
        celHeight:50,// px,
        labelsWidth:80,// px,
        draggable:true,
        onDrop:function(){},
        dropClass:"sscheduler-droppable",
        dropHoverClass:"sscheduler-hover-droppable",
        orari:[
            {from:"08:00",to:"13:00"},
            {from:"14:00",to:"22:00"}
        ]
    },options||{});
    this.currentDay = moment(settings.startDate,dateFormat);

    /**
     * Set settings
     * @param key
     * @param value
     */
    this.set=function(key,value){
        settings[key]=value;
    };
    /**
     * Get settings
     * @param key
     * @returns {*}
     */
    this.get=function(key){
        return settings[key];
    };
    this.render = function(){
        var html = '<table class="table table-striped sscheduler table-bordered">'+renderTitles()+renderBody()+'</table>';
        $(selector).html(html);
        $( ".sscheduler-datepicker" ).datepicker({
            dateFormat:"yy-mm-dd"
        }).on("change",function(){
            self.setDate($(this).val());
        });
    };
    var renderTitles = function(){
        var html = '<thead><tr>';
        html += '<th style="width:'+self.get('labelsWidth')+'px"><input type="text" class="sscheduler-datepicker" value="'+self.currentDay.format(dateFormat)+'"></th>';
        $.each(self.get('titles'),function(k,v){
            html += '<th>'+ v.title+'</th>';
        });
        html += '</tr></thead>';
        return html;
    };
    var renderBody = function(){
        var html = '<tbody id="selectable">';
        var intervals = self.getIntervals();
        for(var i = 0;i<intervals.length;i++){
            var interval = intervals[i];
            var settings=$.extend({
                eventClass:"",
                orariClass:"",
                celHeight:0,
                disabled:false,
            },interval.data||{});
            //intervals labels
            html += '<tr class="orari '+settings.orariClass+'">';
            html += '<td class="'+interval.data.class+'"><small>'+intervals[i].from.format("HH:mm")+" - "+intervals[i].to.format("HH:mm")+'</small></td>';
            //intervals cels
            var event_td_classes = [];
            event_td_classes.push('event-container');
            event_td_classes.push(settings.eventClass);
            var event_cel_classes = ['event-cel'];
            if(settings.disabled){
                event_cel_classes.push('interval-disabled');
            }
            var event_cel_height=self.get('celHeight');
            if(settings.celHeight>0){
                event_cel_height =settings.celHeight;
            }
            $.each(self.get('titles'),function(k,v){
                html += '<td class="'+event_td_classes.join(" ")+'" data-key="'+ v.key+'" data-from="'+interval.from.format(dateTimeFormat)+'" data-to="'+interval.to.format(dateTimeFormat)+'" >' +
                    '<div style="height:'+event_cel_height+'px" class="'+event_cel_classes.join(" ")+'">&nbsp</div>' +
                    '</td>';
            });
            html += '</tr>';
        }
        html += '</tbody>';
        return html;
    };
    this.setDate = function(date){
        console.log(date);
        this.currentDay = moment(date,dateFormat);
        self.render();
        self.getEvents();
    };
    /**
     * hours range to intervals
     * @returns {Array}
     */
    this.getIntervals=function(){
        var intervals = [];
        $.each(self.get('orari'),function(k,v){
            var settings=$.extend({
                celInterval:0
            },v||{});
            var minutesInterval = v.celInterval>0?v.celInterval:self.get('celInterval');
            for (var start = moment(v.from,"HH:mm");start.isBefore(moment(v.to,"HH:mm"));start.add(minutesInterval,'minutes')){


                console.log("minutes:"+minutesInterval);
                var from = moment(start);
                var to = moment(start).add(minutesInterval,'minutes');
                console.log(from.format("HH:mm")+" "+to.format("HH:mm"));
                intervals.push({
                    from:from.set({year:self.currentDay.get("year"),month:self.currentDay.get("month"),date:self.currentDay.get("date")}),
                    to:to.set({year:self.currentDay.get("year"),month:self.currentDay.get("month"),date:self.currentDay.get("date")}),
                    data:v
                });
            }
        });
        return intervals;
    };
    /**
     * get remote events as json object
     */
    this.getEvents = function(){
        var request = {from:self.currentDay.format(dateFormat),to:self.currentDay.format(dateFormat)};
        self.get('source')(request,function(events){
            //console.log(events);
            for(var i=0;i<events.length;i++){
                addEvent(events[i]);
            }
            self.bindEvents();
        });
    };
    /**
     * bind events after render
     */
    this.bindEvents = function(){
        if(self.get("draggable")) {
            $(".event").draggable({
                revert: 'invalid'
            });
            $(".event-cel:not(.interval-disabled)").droppable({
                accept: function(e){
                    if(e.hasClass("event")){
                        //same container
                        if(e.parent().get(0)==this){
                            return false;
                        }
                        //container has event
                        if($(".event", $(this)).length>0){
                            return false;
                        }
                        return true;
                    }
                },
                activeClass: self.get("dropClass"),
                hoverClass: self.get("dropHoverClass"),
                drop: function (event, ui) {
                    //move event to new container
                    $(this).html(ui.draggable);
                    $(ui.draggable).css({top: 0, left: 0});
                    self.get("onDrop")();
                }
            });
        }
    };
    var addEvent = function(event){
        //prendo tutti td con la key del evento
        var elementsKey = $(".event-container[data-key="+event[self.get('keyName')]+"]");
        //comparo la data d'inizio
        elementsKey.each(function(){
            var $this = $(this);
            var mfrom = moment($this.data("from"),dateTimeFormat);
            var mto = moment($this.data("to"),dateTimeFormat);
            var mstart =moment(event.start);
            var mend =moment(event.end);
            if(mstart.isBetween(mfrom,mto)||mstart.isSame(mfrom)){
                var event_cel_height=self.get('celHeight');
                var event_cel_interval=self.get('celInterval');
                var duration_min = mend.diff(mstart,"minutes");
                var eventHeigth = parseInt(duration_min*event_cel_height/event_cel_interval);

                $this.find(".event-cel").html("<div class='event' style='height: "+(eventHeigth)+"px'><div class='event-draw'>"+event.title+"</div></div>");
                return false;
            }else{
                console.log(mstart.format(dateTimeFormat)+" "+mfrom.format(dateTimeFormat));
            }
        });
    }
    var init=function(){
        self.render();
        self.getEvents();
    }
    init();
};
