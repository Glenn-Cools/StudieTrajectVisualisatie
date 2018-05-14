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

function create_graph(diplomaList,trajectList,start,stop,minimumPercentageOfStudents=1){
	var link_map = new Map();
	var nodes_set =  new Set();
	var total_number_of_students = 0;
	trajectList.forEach(function(t){
		var from;
		var to;
		var started = false;
		var ended = false;
		for(var j = 1; j < t.traject_length; j++){

			// while from != start skip 
			// when from == start include until
			// to == Stop => from == stop
			
			from = t["opl"+j];
			to = t["opl"+(j+1)];

			if(from == start || start == null){ // make sure to only start with the given start programme
				started = true;
			}
			if(from == stop && stop != null){
				ended = true;
			}
			if(started && !ended){
				//if((from == start && stop == null)||(start == null && to == stop)){
					total_number_of_students += t.aantal;
					ended = true; // make sure every traject just gets counted once
				//}
			}
			if(to == stop){
				ended = true;
			}
		}
	})

	var minimumNumberOfStudents = total_number_of_students*minimumPercentageOfStudents;

	console.log(total_number_of_students)
	console.log(minimumPercentageOfStudents)
	console.log(minimumNumberOfStudents)

	for(var i = 0;i < trajectList.length; i++){
		var traject = trajectList[i];
		if(traject.aantal>=minimumNumberOfStudents){
			var from;
			var to;
			var started = false;
			var ended = false;
			for(var j = 1; j < traject.traject_length; j++){

				// while from != start skip 
				// when from == start include until
				// to == Stop => from == stop
				
				
				from = traject["opl"+j];
				to = traject["opl"+(j+1)];

				if(from == start || start == null){ // make sure to only start with the given start programme
					started = true;
				}
				if(from == stop && stop != null){
					ended = true;
				}

				if(started && !ended){
					var key = from + "," + to;
					link_map = update_links(link_map,key,traject.aantal)
					nodes_set.add(find_by_code(diplomaList,from)) 
				}

				if(to == stop){
					ended = true;
				}

				
			}
			if(stop == null){
				nodes_set.add(find_by_code(diplomaList,to))
			}
		}
	}

	if(stop!= null && nodes_set.size>0){
		nodes_set.add(find_by_code(diplomaList,stop));
	}
			

	var nodes = Array.from(nodes_set);

	//console.log(link_map)

	var links = [];
	link_map.forEach(function(value,key) {
			var link = convertToLink(diplomaList,key,value);
			links.push(link)
	});

	var graph = {"nodes": nodes, "links": links};

	//console.log(graph)

	graph.links.forEach(function (d, i) {
		graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
		graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
	});

	return JSON.parse(JSON.stringify(graph)) // perform a deep copy to ensure the original data doesn't get altered down the road

}