
//#region variables
var width = 500;
var height = 600;
var radius = 60;
var colors = d3.scale.category10();
var svg_clicked = false;
var timer;
var draw_mode;
var clicked;
var clicked_node = null, 
    start_node = null,
    end_node = null;
var clicked_link = null;
var on_node = false;
var bordercolor = '#404040';
var border = 1;
var dialog_control;
var consensus_level = 0,
    empowerment = 0,
    flow = 0;
//#endregion 
var svg_container = d3.select('#full_container').append('div')
                                                .attr('id','svg_container')
                                                .style({
                                                    'width': width + 'px',
                                                    'height': height + 'px',
                                                    'position':'absolute'
                                                });

var svg = d3.select('#svg_container').append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('border', 1)
            .on('click', svgclick);

var flow_page = d3.select('#full_container').append('div')
        .attr('id', 'flow_container')
       .style('width', window.innerWidth + 'px')
       .style('height', 600 + 'px')
       .style('margin-top', 0 + 'px')
       .style('display', 'none')
       .style('position', 'absolute');
               
//.style('margin-left', 520 + 'px');

set_trend();

var borderPath = svg.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("height", height)
                    .attr("width", width)
                    .style("stroke", bordercolor)
                    .style("fill", "none")
                    .style("stroke-width", border);

var nodes = [
    { id: 0, name: 'a', benefit: 3 },
    { id: 1, name: 'b', benefit: 4 },
    { id: 2, name: 'c', benefit: 3 }
];

var links = [
    {
        source: 0, target: 1, interaction:
        [
            { name: 'a=b', give: 'money', source_affect: 5, receive: 'ticket', target_affect: -1 },
            { name: 'a=b2', give: 'gname', source_affect: -2, receive: 'credit', target_affect: 2 }
        ]
    },
    {
        source: 1, target: 2, interaction:
        [
            { name: 'b=c', give: 'ttt', source_affect: -2, receive: 'rrr', target_affect: 3 }
        ]
    }
];

var d3_variables = { consensus_level: consensus_level, empowerment_level: empowerment, flow_level: flow };

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(60)
    .charge(-500)
    .on('tick', tick);

var draw_line = svg.append('svg:path')
                   .attr('class', 'link draw_line_hidden')
                   .attr('d', 'M0,0L0,0');

var activity = svg.append('svg:g').selectAll('path');
var stakeholder = svg.append('svg:g').selectAll('g');

function tick() {
    activity.attr('d', function (d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    stakeholder.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}
function do_changes() {      
    //links
    activity = activity.data(links);

    activity.enter().append('svg:path')
            .attr('class', 'link')
            .on('mouseover', function (d) {
                d3.select(this).style('stroke-width', '6px');
            })
            .on('mouseout', function (d) {
                d3.select(this).style('stroke-width', '4px');
            })
            .on('click', function (d) {
                if (clicked) {
                    //double_click();
                    clicked = false;
                    clicked_link = d;
                    interaction_edit(d);
                    clearTimeout(timer);
                    d3.event.stopPropagation();
                }
                else {
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(function () {
                        //single_click();
                        clicked = false;
                    }, 200);
                    clicked = true;
                }
            });
    activity.exit().remove();

    //nodes
    stakeholder = stakeholder.data(nodes, function (d) { return d.id; });

    var g = stakeholder.enter().append('svg:g').call(force.drag);

    g.append('svg:rect')
      .attr('class', 'node')
      .attr('width', 30)
      .attr('height', 30)
      .attr('x', -15)
      .attr('y', -15)
      .style('fill', function (d, i) { return colors(i); })
      .on('mouseover', function (d) {
          on_node = true;
          d3.select(this).attr('transform', 'scale(1.1)')
                         .style('stroke', function (d, i) { return d3.rgb(d3.select(this).style('fill')).darker(1); })
                         .style('stroke-width', '2px');
      })
      .on('mouseout', function(d){
          on_node = false;
          d3.select(this).attr('transform', '')
                         //.style('stroke', function (d, i) { return d3.rgb(d3.select(this).style('fill')); })
                         .style('stroke-width', '0px');
      })
      .on('click', function (d) {
          if (d3.event.defaultPrevented) return;
          if (clicked) {
              //double_click();
              clicked = false;
              clicked_node = d;
              add_stakeholder(d.id, d.x, d.y, 'edit');                     
              clearTimeout(timer);
              d3.event.stopPropagation();
          }
          else {
              if (timer) clearTimeout(timer);
              timer = setTimeout(function () {
                  //single_click();
                  clicked = false;
                  //new line handle
                  clicked_node = d;
                  if(start_node == null){
                      start_node = clicked_node;
                      //show draw line
                      draw_line.classed('draw_line_hidden', false)
                               .attr('d', 'M' + start_node.x + ',' + start_node.y + 'L' + start_node.x + ',' + start_node.y);
                      draw_line.on('click', function () {
                          if (!on_node) {
                              reset_node();
                          }
                      });
                      svg.on('mousemove', mousemove);
                  }
                  else if (start_node == clicked_node){
                      reset_node();
                  }
                  else{
                      end_node = clicked_node;
                      var link = { source: start_node, target: end_node, interaction:[] };
                      links.push(link);
                      draw_line.classed('draw_line_hidden', true);
                      clicked_link = link;
                      interaction_edit(link);                            
                      do_changes();
                  }
              }, 200);
              clicked = true;
          }
      });
           
    g.append('svg:text')
        .attr("id", function (d) { return "text_" + d.id; })
        .attr("x", ".2em")
        .attr("y", ".600em")
        .attr("text-anchor", "middle")
        .attr('class', 'id')
        .style('fill', '#404040')
        .text(function (d) { return d.name; })
        .call(wrap, 100);

    stakeholder.exit().remove();        
    force.start();
}   

function mousemove() {
    draw_line.attr('d', 'M' + start_node.x + ',' + start_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
}

function interaction_edit(d) {
    cretae_interaction_container(d);        
}

function cretae_interaction_container(link) {
    var container = d3.select('div.interaction_container');
    container.html('');
    container.classed('interaction_container_hidden', false);
    var table = container.append('table')
                         .attr('id', 'interaction_table')
                         .attr('class', 'interaction_container');
    var thead = table.append('thead').append('tr');
    var controller = thead.append('th')
                         .text('interaction')
                         .style('width', '20%');
    controller.append('input')
                         .attr('type', 'button')
                         .attr('value', '+')
                         .attr('onclick', 'add_interaction()')
    controller.append('input')
                         .attr('type', 'button')
                         .attr('value', 'flow')
                         .attr('onclick', 'flow_adjust()');

    thead.append('th').text(link.source.name).style('width', '30%');
    thead.append('th').text(link.source.name + "'s affect").style('width', '10%');
    thead.append('th').text(link.target.name).style('width', '30%');
    thead.append('th').text(link.target.name + "'s affect").style('width', '10%');
            
    var tbody = table.append('tbody').attr('id', 'item');;
    for (i = 0; i < link.interaction.length; i++) {
        var tr = tbody.append('tr');
        tr.append('td').append('input')
                          .attr('type', 'text')
                          .attr('id', 'interaction' + (i + 1))
                          .attr('value', link.interaction[i].name);
        tr.append('td').append('input')
                          .attr('type', 'text')
                          .attr('id', 'give' + (i + 1))
                          .attr('value', link.interaction[i].give);
        tr.append('td').append('input')
                       .attr('type', 'text')
                       .attr('id', 'source_affect' + (i + 1))
                       .attr('value', link.interaction[i].source_affect)
                       .attr('size', '2');
        tr.append('td').append('input')
                          .attr('type', 'text')
                          .attr('id', 'receive' + (i + 1))
                          .attr('value', link.interaction[i].receive);
        tr.append('td').append('input')
                       .attr('type', 'text')
                       .attr('id', 'target_affect' + (i + 1))
                       .attr('value', link.interaction[i].target_affect)
                       .attr('size', '2');
    }
    interaction_control();
}

function flow_adjust() {
    flow_page.style({
        'display': 'block',
    });
    flow_page.append('object')
             .attr('type','text/html')
             .attr('data', 'http://localhost:3000/')
             .attr('width','1000px')
             .attr('height', '800px');

}

function interaction_control() {
    var tbody = d3.select('table.interaction_container').append('tbody').attr('id', 'control');

    var control_row = tbody.append('tr')
               .append('td')
               .attr('colspan', 6)
               .style('text-align', 'center');
    control_row.append('input')
               .attr('type', 'button')
               .attr('value', 'OK')
               .attr('alt', '')
               .attr('onclick', 'save_interaction("save");');

    control_row.append('input')
               .attr('type', 'button')
               .attr('value', 'Cancel')
               .attr('alt', '')
               .attr('onclick', 'save_interaction("no");');
}


function save_interaction(order) {
    var container = d3.select('div.interaction_container');
    if (order == 'save') {
        var table = d3.select('div.interaction_container').select('#item');
        var new_link = [];
        for (i = 0; i < table[0][0].childNodes.length; i++) {
            var _name = $('#interaction' + (i + 1)).val();
            var _give = $('#give' + (i + 1)).val();
            var _receive = $('#receive' + (i + 1)).val();
            var _source_affect = $('#source_affect' + (i + 1)).val();
            var _target_affect = $('#target_affect' + (i + 1)).val();
            if ((_name != '') && (_give != '') && (_receive != '')) {
                var interact = { name: _name, give: _give, source_affect: _source_affect, receive: _receive, target_affect: _target_affect };
                new_link.push(interact);
            }
        }
        clicked_link.interaction = new_link;
        links.filter(function (d) {
            if(d.target == clicked_link.target && d.source == clicked_link.source)
            {
                d = clicked_link;
            }
        });
        benefit_update();
    }
    container.html('')
             .classed('interaction_container_hidden', true);
            
    reset_node();
}

function benefit_update() {
    var t_benefit = 0;
    $.each(nodes, function (i, node) {
        var node_id = node.id;
        $.each(links, function (j, link) {
            if (link.source.id == node_id) {
                for (k = 0; k < link.interaction.length; k++) {
                    t_benefit = t_benefit + parseInt(link.interaction[k].source_affect, 10);
                }
            }
            else if (link.target.id == node_id) {
                for (k = 0; k < link.interaction.length; k++) {
                    t_benefit = t_benefit + parseInt(link.interaction[k].target_affect, 10);
                }
            }
        });
        node.benefit = t_benefit;
        t_benefit = 0;
    });
    run_consensus();
}

function run_consensus() {
    var positive_counter = 0, negative_counter = 0;
    $.each(nodes, function (i, node) {
        if (node.benefit > 0)
            positive_counter++;
        else if (node.benefit < 0)
            negative_counter++;
    });
    consensus_level = parseFloat(positive_counter) / parseFloat(nodes.length);
    d3_variables.consensus_level = consensus_level.toFixed(2);
}

function stakeholder_delete() {
    $(".stakeholder_delete").dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "OK": function () {
                nodes.filter(function (d, i) {
                    if(d.id == clicked_node.id)
                    {
                        nodes.splice(i, 1);
                        var toSplice = links.filter(function (l) {
                            return (l.source === clicked_node || l.target === clicked_node);
                        });
                        toSplice.map(function (l) {
                            links.splice(links.indexOf(l), 1);
                        });
                    }
                });
                reset_node();
                do_changes();
                $(".stakeholder_creater").dialog("close");
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

function reset_node() {
    start_node = null;
    clicked_node = null;
    end_node = null;
    clicked_link = null;
    draw_line.classed('draw_line_hidden', true);
    svg.on("mousemove", null);
}

function svgclick() {
    if (d3.event.target.nodeName == 'svg') {
        if (svg_clicked) {
            //double_click();
            svg_clicked = false;
            var click_position = d3.mouse(this);
            add_stakeholder(nodes.length, click_position[0], click_position[1], 'add');
            clearTimeout(timer);
            d3.event.stopPropagation();
        }
        else {
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () {
                //single_click();
                svg_clicked = false;
                if (!draw_line.classed('draw_line_hidden') && !on_node) {
                    reset_node();
                }
            }, 200);
            svg_clicked = true;
        }
    }
}

function add_stakeholder(_index, _x, _y, edit_type) {
    var benefit_score = 0;
    var stakeholder_creater = d3.select('div.stakeholder_creater').html('');
    var table = stakeholder_creater.append('table');
    var tr;
    tr = table.append('tr');
    tr.append('td').html('Name�G');
    var stackholder_name = tr.append('td')
                             .append('input')
                             .attr('type', 'text')
                             .attr('id', 'stakeholder_name');
    if (edit_type != 'add') {
        nodes.filter(function (d, i) {
            if (d.id == _index) {
                $('#stakeholder_name').val(d.name);
                benefit_score = d.benefit;
            }
        });
        tr = table.append('tr');
        tr.append('td').html('Benefit score');
        tr.append('td').html(benefit_score);
        tr = table.append('tr');
        tr.append('td').append('input')
                       .attr('type','button')
                       .attr('value', 'delete')
                       .attr('onclick', 'stakeholder_delete();');

    }
    $(".stakeholder_creater").dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "OK": function () {
                var _id = "stakeholder" + (_index + 1);
                var _name = $('#stakeholder_name').val();
                //false = not be used
                var node_check = false;
                nodes.filter(function (d, i) {
                    if ((d.name == _name) && (edit_type =='add'))
                        node_check = true;
                });
                if (node_check) {
                    $('#stakeholder_name').focus();
                    alert("This name" + _name + " has be used!");
                }
                else {
                    if (_name != '') {
                        if (edit_type == 'edit') {
                            nodes.filter(function (d, i) {
                                if (d.id == _index) {
                                    d.name = _name;
                                    var t = d3.selectAll('text')
                                    t.each(function () {
                                        if (d3.select(this)[0][0].id == 'text_' + _index) {
                                            d3.select(this)[0][0].textContent = _name;
                                        }
                                    });
                                    wrap(t, 100);
                                }
                            })
                        }
                        else {
                            var node = { id: _id, name: _name, benefit: 0 };
                            node.x = _x;
                            node.y = _y;
                            nodes.push(node);
                        }
                        $('#stakeholder_name').val('');
                        $(this).dialog("close");
                        do_changes();
                    }
                    else {
                        $('#stackholder_name').focus();
                        alert("Stakeholder's name cannot be empty!");
                    }
                }
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

do_changes();