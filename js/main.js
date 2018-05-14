/*This software is released under the MIT License
MIT License 2014 Denes Csala http://www.csaladen.es
The following software uses the javascript frameworks below,
all of which are distributed under the MIT or GNU/GPL license:
D3.js http://d3js.org/  data-oriented javascript framework. 
	- Sankey plugin http://bost.ocks.org/mike/sankey/ for D3.js (modified) by Mike Bostock, 
	  which is based on the initial version http://tamc.github.io/Sankey/ by Thomas Counsell. 
	  I have incorporated the ability to render Sankey cycles, as pioneered by https://github.com/cfergus
	- Dragdealer.js href="http://skidding.github.io/dragdealer/ by Ovidiu Chereches

*/
/*
MIT license 2018 Glenn Cools https://github.com/Glenn-Cools
This version was modified by Glenn Cools which no longer uses the dragdealer.js
In addition this version uses the following software distrubuted unde the MIT or GNU/GPL license:
	- JavaScript autoComplete v1.0.4 href="https://github.com/Pixabay/JavaScript-autoComplete" by Simon Steinberger
*/

//<!--DATA INIT-->



//<!--DATA filtering-->

function clear_filter(filtername){

	var filter = document.getElementById(filtername)
	filter.value = ""
	draw()

}

function swap_from_to(){

	var fromfilter = document.getElementById("searchbar-input1")
	var tofilter = document.getElementById("searchbar-input2")

	var from = fromfilter.value;
	var to = tofilter.value;

	fromfilter.value = to;
	tofilter.value = from;

	draw();

}

function quick_select_programme(node){

	var fromfilter = document.getElementById("searchbar-input1")
	var tofilter = document.getElementById("searchbar-input2")

	if(fromfilter.value == node.name && tofilter.value != ""){
			clear_filter("searchbar-input1")
	}else if(tofilter.value == node.name && fromfilter.value != ""){
			clear_filter("searchbar-input2")
	}else if(fromfilter.value == "" && tofilter.value != node.name ){
		fromfilter.value = node.name;
	}else if(tofilter.value == "" && fromfilter.value != node.name){
		tofilter.value =node.name;
	}else{
		return
	}

	draw()

}

function draw() {

	var disclaimer = d3.select("#disclaimer");
	disclaimer.attr("style","display:none");

	var diplomaName1 = document.getElementById("searchbar-input1").value
	var diplomaName2 = document.getElementById("searchbar-input2").value

	var filtered_trajects = traject_list;

	//filter the trajects according to the given input from the filters

	var start = null;
	var stop = null;

	if(diplomaName1 != ""){
		start = dilploma_name_to_code(diplomaName1);
		filtered_trajects = filter_programme(filtered_trajects,start)
		if(diplomaName2 != ""){
			stop = dilploma_name_to_code(diplomaName2);
			filtered_trajects = filter_programme(filtered_trajects,stop)
		}
	}else if(diplomaName2 != ""){
		stop = dilploma_name_to_code(diplomaName2);
		filtered_trajects = filter_programme(filtered_trajects,stop)
	}else{
		svg.selectAll("g").remove();
		return
	}

	//console.log(filtered_trajects)

	var minimumPercentageOfStudents = document.getElementById("slider").value/10/100;

	// create the graph based on the filtered trajects
	var graph = create_graph(diplomaList,filtered_trajects,start,stop,minimumPercentageOfStudents);

	//console.log(graph)

	// convey the data to the section that draws the visualisation based on the data
	change(graph)
	
}

function draw_legend(colorAxis){

	var legend = d3.select(".my-legend");
    var domain = colorAxis.domain();
    var ul = legend.append("div").attr("class","legend-scale")
    			.append("ul").attr("class","legend-labels")

	for(var i = 0; i< domain.length;i++){

		var text = domain[i]

		var li = ul.append("li")
			li.append("text").text(text);
		
		var span = li.append("span");
			span.style("background",colorAxis(text))
	}
	legend.attr("style","display:inline-table")
}

//<!--SANKEY DIAGRAM-->

var showLegend = false;

var parallelrendering=false;
var minnodewidth = 20; // mininum width required to show the value of the node
//var mininimumNodeHeight = 10;
var padding = 28;
var lowopacity = 0.3;
var highopacity = 0.7;
var fixedlayout=[];
var formatNumber = d3.format(",.0f");

var colorAxis = d3.scale.category10()	// TODO : ordinal scale with colors self picked... 
		.domain(["bachelor","master","bachelor-na-bachelor","master-na-master","postgraduaat","leraar","doctoraat","schakelprogramma","voorbereidingsprogramma","andere"]);

var color = function(name){
	if(name.indexOf("(mnm)")>-1){
    	return colorAxis("master-na-master");
    }else if(name.indexOf("(bnb)")>-1){
        return colorAxis("bachelor-na-bachelor");
    }else if(name.indexOf("Schakelprogramma")>-1||name.indexOf("Bridging Programme")>-1){
        return colorAxis("schakelprogramma");
    }else if(name.indexOf("Voorbereidingsprogramma")>-1||name.indexOf("Preparatory Programme")>-1){
        return colorAxis("voorbereidingsprogramma");
    }else if(name.indexOf("Postgrad")>-1){
        return colorAxis("postgraduaat");
    }else if(name.indexOf("Doctor")>-1){
        return colorAxis("doctoraat");
    }else if(name.indexOf("Leraar")>-1){
        return colorAxis("leraar");
    }else if(name.indexOf("Bachelor")>-1){
        return colorAxis("bachelor");
    }else if(name.indexOf("Master")>-1){
        return colorAxis("master");
    }else{
    	return colorAxis("andere");
    }
}

var formatName = function(name){
	name = name.toLowerCase();
	if(name.indexOf("bachelor in de ")>-1){
		name = name.replace("bachelor in de ","");
	}else if(name.indexOf("bachelor of ")>-1){
		name = name.replace("bachelor of ","");
	}else if(name.indexOf("bachelor in het ")>-1){
		name = name.replace("bachelor in het ","");
	}else if(name.indexOf("bachelor in ")>-1){
		name = name.replace("bachelor in ","");
	}

	if(name.indexOf("master in de ")>-1){
		name = name.replace("master in de ","");
	}else if(name.indexOf("master of ")>-1){
		name = name.replace("master of ","");
	}else if(name.indexOf("master in het ")>-1){
		name = name.replace("master in het ","");
	}else if(name.indexOf("master in ")>-1){
		name = name.replace("master in ","")
	}


	if(name.indexOf("(bnb)")>-1){
		name  = name.replace("(bnb)","");
	}else if(name.indexOf("(mnm)")>-1){
		name = name.replace("(mnm)","");
	}


	/*if(name.indexOf("bachelor ")>-1){
		name = name.replace("bachelor ","");
	}else if(name.indexOf("master ")>-1){
		name = name.replace("master ","");
	}*/

	// make the first letter of the string a capital letter.
	return name.charAt(0).toUpperCase() + name.slice(1);

}

var margin = {
        top: 20,
        right: 50,
        bottom: 10,
        left: 40
    }

// a way to make the height adaptable to the amount of data with a fixed minimum height

var top_svg = d3.select("#chart").append("svg")

top_svg.append("rect")
	.attr("x",0).attr("y",0)
	.attr("width","100%")
	.attr("height","100%")
	.attr("fill","white");
svg=top_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function change(d){

	var width = 1700 - margin.left-margin.right
    var height= 830 - margin.top - margin.bottom

    var sankey = d3.sankey().nodeWidth(30)
								.nodePadding(padding)

	var path = sankey.reversibleLink();

	svg.selectAll("g").remove();

	// if the legend is hidden, show it.
	if(!showLegend){
		draw_legend(colorAxis);
		showLegend = true
	}

	if(d.nodes.length == 0){
		svg.append("g").append("text").attr("class","warning").text("Er zijn geen trajecten gevonden aan de hand van de gekozen filters.");
		return;
	}

	//TODO: try - catch for vis that are to large and return a explanation/suggestion?
	var successful = false;
	//var errorThrown = false;
	while(!successful){

		sankey.size([width, height]);	

		//compute node and link placements
		sankey.nodes(d.nodes)
				.links(d.links)
		sankey.layout(500);

		try{
			var g = svg.append("g") //link
				.selectAll(".link")
				.data(d.links).enter()
					.append("g")
					.attr("class", "link")
					.sort(function(j, i) { return i.dy - j.dy });

			var h = g.append("path") //path0
				.attr("d", path(0));
			var f = g.append("path") //path1
				.attr("d", path(1));
			var e = g.append("path") //path2
				.attr("d", path(2));

			g.attr("fill", function(i) {
				if (i.source.fill) {
					return i.source.fill;
				}else{
					return i.source.color = color(i.source.name);
				}})
				.attr("opacity", lowopacity)
				.on("mouseover", function(d) {
					d3.select(this).style('opacity', highopacity);
				})
				.on("mouseout", function(d) {
					d3.select(this).style('opacity', lowopacity);
				})
				.append("title") //link
				.text(function(i) {
					return i.source.name + " → " + i.target.name + "\n" + formatNumber(i.value)
				});



			var c = svg.append("g") //node
				.selectAll(".node")
				.data(d.nodes).enter()
					.append("g").attr("class", "node")
					.attr("transform", function(i) {
						return "translate(" + i.x + "," + i.y + ")";
					});
					/*.call(d3.behavior.drag().origin(function(i) {
							return i;
						})
						.on("dragstart", function() {
							this.parentNode.appendChild(this)
						})
						.on("drag", b)
					);*/

			c.append("rect") //node
				.attr("height", function(i) {
					if(i.dy>0){
						return i.dy;
					}else{
						throw new NoRoomException();
					}

					/*if(i.dy>mininimumNodeHeight){
						return i.dy;
					}else {
						return mininimumNodeHeight
					}*/
				})
				.attr("width", sankey.nodeWidth())
				.style("fill", function(i) {
					return i.color = color(i.name)
				})
				.style("stroke", function(i) {
					return d3.rgb(i.color).darker(2)
				})
				.on("mouseover", function(d) {
					svg.selectAll(".link").filter(function(l) {
						return l.source == d || l.target == d;
					}).transition()
					.style('opacity', highopacity);
				})
				.on("mouseout", function(d) {
					svg.selectAll(".link").filter(function(l) {
						return l.source == d || l.target == d;
					}).transition()
					.style('opacity', lowopacity);
				})
				.on("click",function(d){quick_select_programme(d)})
				/*.on("dblclick", function(d) {  // this doesn't fire
					console.log("dblclick")
					svg.selectAll(".link").filter(function(l) {
						return l.target == d;
					}).attr("display", function() {
						if (d3.select(this).attr("display") == "none"){
							return "inline";
						}else{
						 	return "none";
						}
					});
				})*/
				.append("title").text(function(i) {
					return i.name + "\n" + formatNumber(i.value)
					
				});
			c.append("text") //node
				.attr("x", -6).attr("y", function(i) {
					return i.dy / 2
				})
				.attr("dy", ".35em").attr("text-anchor", "end").attr("font-size","16px")
				.text(function(i) {
					return formatName(i.name);
				})
				.filter(function(i) {
					return i.x < width / 2
				})
				.attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start")

		top_svg.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);
				successful = true;
		}catch(err){
			if(err.name == "NoRoomException"){
	   			height += 200
	   			svg.selectAll("g").remove();

				//console.log(d)
			}else{
				throw err
			}
			
		}
	}



	// shows the value of then node inside the node if the node is 'big' enough
/*	c.append("text") //node
		.attr("x", function(i) {return -i.dy / 2})
		.attr("y", function(i) {return i.dx / 2 + 9})
		.attr("transform", "rotate(270)").attr("text-anchor", "middle").attr("font-size","23px").text(function(i) {
			if (i.dy>minnodewidth){
				return formatNumber(i.value);
			}
		})
		.attr("fill",function(d){
			return d3.rgb(d["color"]).brighter(2)
		})
		.attr("stroke",function(d){
			return d3.rgb(d["color"]).darker(2)
		})
		.attr("stroke-width","1px");*/
		
	function b(i) { //dragmove
		if (true ){ // document.getElementById("ymove").checked
			if (true) { //document.getElementById("xmove").checked
				d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
			} else {
				d3.select(this).attr("transform", "translate(" + i.x + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
			}
		} else {
			if (document.getElementById("xmove").checked) {
				d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + i.y + ")")
			}
		}
		sankey.relayout();
		f.attr("d", path(1));
		h.attr("d", path(0));
		e.attr("d", path(2))
	};

};

function NoRoomException() {
   this.name = 'NoRoomException';
}