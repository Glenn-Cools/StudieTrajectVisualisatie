/*
*This software is released under the MIT License

MIT License 2018 Glenn Cools https://github.com/Glenn-Cools

*/



/* Usage 
	Use  create_graph(diplomaList,traject_list)  to create a graph from the given trajects and the diploma_list to lookup the codes
	Use  filter__X to filter the traject_list based on X 
*/


// test total
/*
programme_code = "4323_EN"
filtered_trajects = filter_programme(traject_list,programme_code)
var graph = create_graph(diplomaList,filtered_trajects)
console.log(graph)
*/

	//start filters

function filter_programme(trajectList, programmeCode){
	return trajectList.filter(function(traject){
		return traject_contains(traject,programmeCode);
	})
}

function filter_department(trajectList,department){
	return null
}


//end filters

// helper filter functions

function traject_contains(traject,propertyValue){
	return Object.values(traject).includes(propertyValue)
}

// algorithm

function find_by_code(diplomaList,code_in){
	for(var i =0;i<diplomaList.length;i++){
		var diploma = diplomaList[i];
		if(diploma.code == code_in){
			return diploma;
		}
	}

	/*let diploma = diplomaList.find(dip => dip.code === code_in);

    return diploma;*/

	throw "Invalid code: " + code_in;
}

function update_links(links,key,value){
	if(links.has(key)){
		links.set(key,links.get(key)+value)
	}else{
		links.set(key,value)
	}
	return links;
}

function convertToLink(diplomaList,key,value){

	var keyparts = key.split(",")
	var from = keyparts[0]
	var to = keyparts[1]
	var link = {"source": find_by_code(diplomaList,from), "target": find_by_code(diplomaList,to), "value" : value};

	return link;
}

function create_graph(diplomaList,trajectList){
	var link_map = new Map();
	var nodes_set =  new Set();

	for(var i = 0;i < trajectList.length; i++){
		var traject = trajectList[i];
		var from;
		var to;
		for(var j = 1; j < traject.traject_length; j++){
			from = traject["opl"+j];
			to = traject["opl"+(j+1)];
			var key = from + "," + to;
			link_map = update_links(link_map,key,traject.aantal)
			nodes_set.add(find_by_code(diplomaList,from)) 
		}
		nodes_set.add(find_by_code(diplomaList,to)) 
	}

	var nodes = Array.from(nodes_set);

	var links = [];
	link_map.forEach(function(value,key) {
		var link = convertToLink(diplomaList,key,value);
		links.push(link)
	});

	var graph = {"nodes": nodes, "links": links};

	graph.links.forEach(function (d, i) {
		graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
		graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
	});

	return JSON.parse(JSON.stringify(graph)) // perform a deep copy to ensure the original data doesn't get altered down the road

}

//console.log(create_graph(diplomaList,traject_list))