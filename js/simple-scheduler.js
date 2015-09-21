
sScheduler = function(selector,options){
    var render = function(){
        var html = '<table class="table table-striped">'+renderTitles()+renderBody()+'</table>';
        $(selector).html(html);
    };
    var renderTitles = function(){
        var html = '<thead><tr>';
        html += '<th></th>';
        $.each(options.titles,function(k,v){
            html += '<th>'+ v.title+'</th>';
        });
        html += '</tr></thead>';
        return html;
    };
    var renderBody = function(){
        var html = '<tbody>';
        var intervals = getIntervals();
        for(var i = 0;i<intervals.length;i++){
            html += '<tr>';
            html += '<td><small>'+intervals[i].from.format("HH:mm")+" - "+intervals[i].to.format("HH:mm")+'</small></td>';
            $.each(options.titles,function(k,v){
                html += '<td>'+ v.title+'</td>';
            });
            html += '</tr>';
        }
        html += '</tbody>';
        return html;
    }
    var getIntervals=function(){
        var intervals = [];
        $.each(options.orari,function(k,v){
            for (var start = moment(v.from,"HH:mm");start.isBefore(moment(v.to,"HH:mm"));start.add(options.celInterval,'minutes')){
                var from = moment(start);
                var to = moment(start).add(options.celInterval,'minutes');
                console.log(from.format("HH:mm")+" "+to.format("HH:mm"));
                intervals.push({from:from,to:to});
            }
        });
        return intervals;
    }
    render();
};