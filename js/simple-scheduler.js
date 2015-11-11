"use strict";
var sScheduler = function(selector,options){
    var self = this;
    this.slotMoments = [];
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
        select:function(jqEvent,elements){},
        titleRender:null, //function(titleObj){},
        slotDisabledError:function(){},
        draggable:true,
        titlesKeyName:'key',
        titlesLabelName:'title',
        eventRender:function(event,element){},
        onDrop:function(event,slotElement,eventElement){},
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
        var container = $(selector);
        container.html(table);
        $( ".sscheduler-datepicker" ).datepicker({
            dateFormat:"yy-mm-dd"
        }).on("change",function(){
            self.setDate($(this).val());
        });
        //$(".event-container",container).on('click',self.selectInterval);
        var eventsContainers =$(".event-container",container);
        eventsContainers.on('mousedown', function (evt) {
            self.selectInterval.call(this,evt);
            eventsContainers.on('mouseup mousemove', function handler(evt) {
                console.log(evt.type);
                if (evt.type === 'mouseup') {
                    // click
                    self.selectInterval.call(this,evt);
                    eventsContainers.off('mouseup mousemove', handler);
                } else {
                    // drag
                    self.selectInterval.call(this,evt);
                }

            });
        });
    };
    this.selectInterval= function(e){

        var container = $(selector);
        var $this = $(this);
        var items_selected = container.find('.event-selected');
        //pulisco
        //console.log(e.target);
        if (e.type === 'mousedown'||!($(e.target).hasClass('event-cel')||$(e.target).hasClass('event-container'))){
            items_selected.removeClass('event-selected');
            return;
        }
        //controllo che non sia disabilitato
        if($this.find(".interval-disabled").length>0){
            items_selected.removeClass('event-selected');
            self.get("slotDisabledError")();
            return;
        }

        //tolgo i select k non hanno la stessa key
        items_selected.not('[data-key='+$this.data('key')+']').removeClass('event-selected');
        //tolgo se il secondo elemento non è precedente o succesivo


        $(this).addClass('event-selected');

        //pulisco
        if (e.type === 'mouseup') {
            console.log("onIntervalSelected");
            items_selected = container.find('.event-selected');
            self.get("select")(e,items_selected);
        }
    };
    var renderTitles = function(){
        var html = '<thead><tr>';
        html += '<th style="width:'+self.get('labelsWidth')+'px"></th>';
        $.each(self.get('titles'),function(k,v){
            var content =  v[self.get('titlesLabelName')];
            if(self.get('titleRender')!=null){
                content = self.get('titleRender')(v);
            }
            html += '<th  class="scheduler-titles" >'+content+'</th>';
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
                disabled:false
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
                celevent.addClass(intervals[i].from.format("YYYYMMDDHHmm"));
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
        self.refresh();
    };
    this.refresh = function(date){
        self.render();
        self.getEvents();
    };
    /**
     * hours range to intervals
     * @returns {Array}
     */
    this.getIntervals=function(){
        var intervals = [];
        self.slotMoments = [];
        //per ogni orario
        for(var i=0;i<self.get('orari').length;i++){
            var v = self.get('orari')[i];
            var minutesInterval = v.slotInterval>0?v.slotInterval:self.get('slotInterval');

            for (var start = moment(v.from,"HH:mm");start.isBefore(moment(v.to,"HH:mm"));start.add(minutesInterval,'minutes')){

                var from = moment(start);
                var to = moment(start).add(minutesInterval,'minutes');
                self.addIntervalMoment(from,to);

                intervals.push({
                    from:from.set({year:self.currentDay.get("year"),month:self.currentDay.get("month"),date:self.currentDay.get("date")}),
                    to:to.set({year:self.currentDay.get("year"),month:self.currentDay.get("month"),date:self.currentDay.get("date")}),
                    data:v
                });
            }

        }
        return intervals;
    };
    this.addIntervalMoment=function(startmoment,endmoment){
        self.slotMoments.push([startmoment,endmoment]);
    };

    this.applyOrari= function(orari){
        for(var i=0;i<orari.length;i++){
            self.enableIntervals(orari[i]);
        }
    };
    this.enableIntervals= function(orario){
        var classes = self.getSlotsClassesInInterval(moment(orario.start,"YYYY-MM-DD HH:mm:ss"),moment(orario.end,"YYYY-MM-DD HH:mm:ss"));
        for(var i=0;i<classes.length;i++){
            classes[i]="."+classes[i];
        }
        var container = $(selector);
        var slotsByKey = $("td[data-key="+orario[self.get('keyName')]+"]",container);
        var slots = slotsByKey.filter(classes.join(", "));
        slots.find(".event-cel").removeClass("interval-disabled");
    };

    /**
     * get remote events as json object
     */
    this.getEvents = function(){
        var request = {from:self.currentDay.format(dateFormat),to:self.currentDay.format(dateFormat)};
        self.get('source')(request,function(events){

            self.applyOrari(events.orari);
            for(var i=0;i<events.events.length;i++){
                addEvent(events.events[i]);
            }
            self.bindEvents(events.disabled,events.orari);
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
                drag:function(e) {

                },
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
                    var $this = $(this);
                    $this.html(ui.draggable);
                    $(ui.draggable).css({top: 0, left: 0});
                    self.get("onDrop")(event,$this.parent(),ui.draggable);
                }
            });
        }
    };
    this.disableIntervals=function(disabled){
        var classes = self.getSlotsClassesInInterval(moment(disabled.start,"YYYY-MM-DD HH:mm:ss"),moment(disabled.end,"YYYY-MM-DD HH:mm:ss"));
        for(var i=0;i<classes.length;i++){
            classes[i]="."+classes[i];
        }
        var container = $(selector);
        var slotsByKey = $("td[data-key="+disabled[self.get('keyName')]+"]",container);
        var slots = slotsByKey.filter(classes.join(", "));
        slots.addClass('slot-diabled');
        slots.find(".event-cel").addClass("interval-disabled");
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
                //console.log(mstart.format(dateTimeFormat)+" "+mfrom.format(dateTimeFormat));
            }
        });
    };
    this.renderEvent= function(eventObj){
        var mstart =moment(eventObj.start);
        var mend =moment(eventObj.end);

        var event = $('<div>');
        event.data('event',eventObj);
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
    };
    /**
     * torna un array di classi per riconoscere tutti gli slot non compressi dentro un intervalo
     * @param mstart
     * @param mend
     */
    this.getSlotsClassesNotInInterval= function(mstart,mend){
        var classes = [];
        for(var i=0;i<self.slotMoments.length;i++){
            //console.log(self.slotMoments[i][0].format('HHmm')+"e is before "+mend.format('HHmm')+"n and "+self.slotMoments[i][1].format('HHmm')+"e is after "+mstart.format('HHmm')+"n");
            if(!(self.slotMoments[i][0].isBefore(mend)&&self.slotMoments[i][1].isAfter(mstart))){
                //console.log(self.slotMoments[i][0].format('YYYYMMDDHHmm'));
                classes.push(self.slotMoments[i][0].format('YYYYMMDDHHmm'));
            }
        }
        return classes;
    };
    /**
     * torna un array di classi per riconoscere tutti gli slot non compressi dentro un intervalo
     * @param mstart
     * @param mend
     */
    this.getSlotsClassesInInterval= function(mstart,mend){
        var classes = [];
        for(var i=0;i<self.slotMoments.length;i++){
            //console.log(self.slotMoments[i][0].format('HHmm')+"e is before "+mend.format('HHmm')+"n and "+self.slotMoments[i][1].format('HHmm')+"e is after "+mstart.format('HHmm')+"n");
            if((self.slotMoments[i][0].isBefore(mend)&&self.slotMoments[i][1].isAfter(mstart))){
                //console.log(self.slotMoments[i][0].format('YYYYMMDDHHmm'));
                classes.push(self.slotMoments[i][0].format('YYYYMMDDHHmm'));
            }
        }
        return classes;
    };
    init();
};
