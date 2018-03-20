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


//<!--DATA ENTRY-->

function draw() {

	var diplomaName1 = document.getElementById("searchbar-input1").value
	var diplomaName2 = document.getElementById("searchbar-input2").value

	var filtered_trajects = traject_list;

	//filter the trajects according to the given input from the filters

	if(diplomaName1 != ""){
		var programme_code1 = dilploma_name_to_code(diplomaName1);
		filtered_trajects = filter_programme(filtered_trajects,programme_code1)
		if(diplomaName2 != ""){
			var programme_code2 = dilploma_name_to_code(diplomaName2);
			filtered_trajects = filter_programme(filtered_trajects,programme_code2)
		}
	}else if(diplomaName2 != ""){
		var programme_code2 = dilploma_name_to_code(diplomaName2);
		filtered_trajects = filter_programme(filtered_trajects,programme_code2)
	}else{
		console.log("ERROR!")
	}

	//console.log(filtered_trajects)

	// create the graph based on the filtered trajects
	var graph = create_graph(diplomaList,filtered_trajects);

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
		.domain(["bachelor","master","bachelor-na-bachelor","master-na-master","postgraduaat","leraar","doctoraat","schakelprogramma","voorbereidingsprogramma","other"]);

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
    	return colorAxis("other");
    }
}

var margin = {
        top: 20,
        right: 10,
        bottom: 30,
        left: 40
    },
    width = 1400 - margin.left-margin.right
    height= 1000 - (margin.top) - margin.bottom

// a way to make the height adaptable to the amount of data with a fixed minimum height

var svg = d3.select("#chart").append("svg")
								.attr("width", width + margin.left + margin.right)
								.attr("height", height + margin.top + margin.bottom);
svg.append("rect")
	.attr("x",0).attr("y",0)
	.attr("width","100%")
	.attr("height","100%")
	.attr("fill","white");
svg=svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function change(d) {

	// if the legend is hidden, show it.
	if(!showLegend){
		draw_legend(colorAxis);
		showLegend = true
	}

	var sankey = d3.sankey().nodeWidth(30)
						.nodePadding(padding)
						.size([width, height]);

	var path = sankey.reversibleLink();

	svg.selectAll("g").remove();

	if(d.nodes.length == 0){
		svg.append("g").append("text").attr("class","warning").text("Er zijn geen trajecten gevonden aan de hand van de gekozen filters.");
		return;
	}

	//TODO: try - catch for vis that are to large and return a explanation/suggestion?

	//compute node and link placements
	sankey.nodes(d.nodes)
			.links(d.links)

	sankey.layout(500);

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
			})
			.call(d3.behavior.drag().origin(function(i) {
					return i;
				})
				.on("dragstart", function() {
					this.parentNode.appendChild(this)
				})
				.on("drag", b)
			);

	c.append("rect") //node
		.attr("height", function(i) {
			return i.dy;
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
		}).on("dblclick", function(d) {  // this doesn't fire
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
		})
		.append("title").text(function(i) {
			return i.name + "\n" + formatNumber(i.value)
			
		});
	c.append("text") //node
		.attr("x", -6).attr("y", function(i) {
			return i.dy / 2
		})
		.attr("dy", ".35em").attr("text-anchor", "end").attr("font-size","16px")
		.text(function(i) {
			return i.name;
		})
		.filter(function(i) {
			return i.x < width / 2
		})
		.attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start")

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