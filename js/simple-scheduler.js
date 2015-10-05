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
        slotInterval:50, // minutes
        slotHeight:50,// px,
        labelsWidth:80,// px,
        draggable:true,
        titlesKeyName:'key',
        titlesLabelName:'title',
        eventRender:function(event,element){},
        onDrop:function(event,mstart){},
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
    this.render = function() {
        var table = $('<table class="table table-striped sscheduler table-bordered">');
        table.append(renderTitles());
        table.append(renderBody());
        $(selector).html(table);
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
            html += '<th  class="scheduler-titles" >'+ v[self.get('titlesLabelName')]+'</th>';
        });
        html += '</tr></thead>';
        return html;
    };
    var renderBody = function(){
        var body = $('<tbody id="selectable">');

        var intervals = self.getIntervals();
        for(var i = 0;i<intervals.length;i++){
            var interval = intervals[i];
            var settings=$.extend({
                eventClass:"",
                class:"",
                slotHeight:0,
                disabled:false,
            },interval.data||{});
            //intervals labels
            var row =  $('<tr>');
            row.addClass(settings.class);

            var callabel = $('<td>');
            callabel.addClass('orari');
            callabel.append('<small>'+intervals[i].from.format("HH:mm")+" - "+intervals[i].to.format("HH:mm")+'</small>');
            row.append(callabel);
            //intervals cels
            var event_td_classes = [];
            event_td_classes.push('event-container');
            event_td_classes.push(settings.eventClass);
            var event_cel_classes = ['event-cel'];
            if(settings.disabled){
                event_cel_classes.push('interval-disabled');
            }
            var event_cel_height=self.get('slotHeight');
            if(settings.slotHeight>0){
                event_cel_height =settings.slotHeight;
            }

            $.each(self.get('titles'),function(k,v){
                var celevent = $('<td>');
                celevent.addClass(event_td_classes.join(" "));
                celevent.attr('data-key',v[self.get('titlesKeyName')]);
                celevent.data('from',interval.from.format(dateTimeFormat));
                celevent.data('to',interval.to.format(dateTimeFormat));

                var event = $('<div>');
                event.height(event_cel_height);
                event.addClass(event_cel_classes.join(" "));

                celevent.append(event);
                row.append(celevent);
            });
            body.append(row);
        }

        return body;
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
                slotInterval:0
            },v||{});
            var minutesInterval = v.slotInterval>0?v.slotInterval:self.get('slotInterval');
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
                revert: 'invalid',
                opacity: 0.7,
                helper:function( event ) {
                    return $(event.currentTarget).clone().height(self.get("slotHeight"));
                }//,
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
                    self.get("onDrop")({},{});
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
            if(mstart.isBetween(mfrom,mto)||mstart.isSame(mfrom)){
                $this.find(".event-cel").html(self.renderEvent(event));
                return false;
            }else{
                console.log(mstart.format(dateTimeFormat)+" "+mfrom.format(dateTimeFormat));
            }
        });
    };
    this.renderEvent= function(eventObj){
        var mstart =moment(eventObj.start);
        var mend =moment(eventObj.end);

        var event = $('<div>');
        event.addClass("event");
        event.append('<div class="event-time-label">'+mstart.format("HH:mm")+' - '+mend.format("HH:mm")+'</div>');
        event.append('<div class="event-draw">'+eventObj.title+'</div>');

        var event_cel_height=self.get('slotHeight');
        var event_cel_interval=self.get('slotInterval');
        var duration_min = mend.diff(mstart,"minutes");
        var eventHeigth = parseInt(duration_min*event_cel_height/event_cel_interval);
        event.height(eventHeigth);
        self.get("eventRender")(eventObj,event);
        return event;
    };
    var init=function(){
        self.render();
        self.getEvents();
    }
    init();
};
