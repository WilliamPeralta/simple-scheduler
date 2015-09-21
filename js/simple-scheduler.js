
sScheduler = function(selector,options){
    var render = function(){
        var html = '<table class="table table-striped">'+renderTitles()+renderBody()+'</table>';
        $(selector).html(html);
    };
    var renderTitles = function(){
        var html = '<thead><tr>';
        $.each(options.titles,function(k,v){
            html += '<th>'+ v.title+'</th>';
        });
        html += '</tr></thead>';
        return html;
    };
    var renderBody = function(){
        return "";
    }
    render();
};