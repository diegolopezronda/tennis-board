$(function(){
	var START  = Date.now();
	const SERVE_SIGN = "*";
	const TIEBREAK_SIGN = "T";
	const WINNER_SIGN = "W";
	var server = 0;
	var current_set = 0;
	var current_game = 0;
	var tie_break = false;
	var game_over = false;
	var player_points = [0,0];
	var player_games = [0,0];
	var player_sets = [0,0];
	var reset_count = 0;
	var push_count = 0;
	var pull_count = 0;
	var RULES = STANDARD;
	var MAX_SETS = getMaxSets(RULES);
	var MAX_WON_SETS = getMaxWonSets(RULES);
	var history = [];

	function init(){
		server = 0;
		current_set = 0;
		current_game = 0;
		tie_break = false;
		game_over = false;
		player_points = [0,0];
		player_games = [0,0];
		player_sets = [0,0];
		reset_count = 0;
		MAX_SETS = getMaxSets(RULES);
		MAX_WON_SETS = getMaxWonSets(RULES);
		history = [];
	}

	function updateClock(){
		reset_count = 0;
		push_count = 0;
		pull_count = 0;
		var n = Date.now();
		var d = new Date(n);
		var e = n-START;
		var z = new Date(e);
		$("#match-datetime").html(d.toLocaleString("en-NZ",{
			weekday:"short",
			second:"2-digit",
			minute:"2-digit",
			hour:"2-digit",
			day:"2-digit",
			month:"2-digit",
			year:"2-digit",
			hour12:false,
		}));
		if(game_over == true) return;
		$("#elapsed-time").html(z.toLocaleTimeString("en-GB",{
			timeZone:"UTC",
			second:"2-digit",
			minute:"2-digit",
			hour:"2-digit",
			hour12:false,
			hourCycle:"h23"
		}));
	};

	function rotateRules(){
		if(game_over == true) return;
		var i = MATCH_TYPES.indexOf(RULES)+1;
		if(i == MATCH_TYPES.length) i = 0;
		RULES = MATCH_TYPES[i];
		MAX_SETS = getMaxSets(RULES);
		MAX_WON_SETS = getMaxWonSets(RULES);
		$("#match-rules").html(RULES);
	}

	function switchService(){
		if(game_over == true) return;
		served = server;
		server = server == 0 ? 1 : 0;
		var serve_sign = tie_break == true ? TIEBREAK_SIGN : SERVE_SIGN;
		$("#player-"+server+"-turn").html(serve_sign);
		$("#player-"+served+"-turn").html("");
	}

	function point(player){
		if(game_over == true) return;
		history.push(player);
		var opponent = player == 0 ? 1 : 0;
		var point_results = getPointResults(
			player_points[player],
			player_points[opponent],
			tie_break
		);
		var new_game = point_results.g;
		player_points[player] = point_results.a;
		player_points[opponent] = point_results.b;
		tie_break = point_results.t;
		$("#player-"+player+"-game").html(point_results.c);
		$("#player-"+opponent+"-game").html(point_results.d);
		//GAME
		if(new_game == true){
			var game_results = getGameResults(
				player_games[player],
				player_games[opponent],
				RULES,
				current_set
			);
			player_games[player] = game_results.a;
			tie_break = game_results.t;
			$("#player-"+player+"-set-"+current_set).html(game_results.a);
			var new_set = game_results.s;
			if(new_set == true){
				tie_break = false;
				player_sets[player] +=1
				if(player_sets[player] == MAX_WON_SETS){
					$("#player-"+player+"-turn").html(WINNER_SIGN);
					$("#player-"+opponent+"-turn").html("");
					game_over = true;
					return;
				}else{
					current_set +=1;
					player_games[player] = 0;
					player_games[opponent] = 0;
					$("#player-"+player+"-set-"+current_set).html(player_games[player]);
					$("#player-"+opponent+"-set-"+current_set).html(player_games[opponent]);
				}
			}
		}
		//SERVICE
		if(point_results.s == true){
			switchService();
		}
	}

	//INIT
	$("#match-rules").html(RULES);
	setInterval(updateClock,1000);

	//MQTT
	var clientID = "Z"+Math.floor(Math.random() * 1000000);
	client = new Paho.MQTT.Client(location.hostname+"/websocket",80,clientID);
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;
	client.connect({keepAliveInterval:21600,onSuccess:onConnect});
	var sync_request = clientID+"."+Date.now();

	function sendPing(){
		message = new Paho.MQTT.Message("ping");
		message.destinationName = "/ping/"+clientID;
		client.send(message);
	}

	function onConnect() {
		$("#sync-pull").removeClass("red-black").addClass("led-black");
		client.subscribe("/title");
		client.subscribe("/rules");
		client.subscribe("/clock");
		client.subscribe("/serve");
		client.subscribe("/sync/out");
		client.subscribe("/player1");
		client.subscribe("/player2");
		client.subscribe("/point");
		client.subscribe("/sync/in");
		client.subscribe("/reset");
		client.subscribe("/ping/"+clientID);
		setInterval(sendPing,1000);
		$("#match-name").change(function(){
			message = new Paho.MQTT.Message($(this).val());
			message.destinationName = "/title";
			client.send(message);
		});
		$("#match-rules").click(function(){
			message = new Paho.MQTT.Message("");
			message.destinationName = "/rules";
			client.send(message);
		});
		$("#elapsed-time").click(function(){
			message = new Paho.MQTT.Message("");
			message.destinationName = "/clock";
			client.send(message);
		});
		$("#service").click(function(){
			message = new Paho.MQTT.Message("");
			message.destinationName = "/serve";
			client.send(message);
		});
		$("#sync-push").click(function(){
			++push_count;
			if(push_count < 3) return;
			push_count = 0;
			var m = {
				title:$("#match-name").val(),
				player1:$("#player-0-name").val(),
				player2:$("#player-1-name").val(),
				clientID,
				history,
				server,
				rules:RULES,
				start:START,
				request:null
			};
			message = new Paho.MQTT.Message(JSON.stringify(m));
			message.destinationName = "/sync/out";
			client.send(message);
		});
		$("#player-0-name").change(function(){
			message = new Paho.MQTT.Message($(this).val());
			message.destinationName = "/player1";
			client.send(message);
		});
		$("#player-1-name").change(function(){
			message = new Paho.MQTT.Message($(this).val());
			message.destinationName = "/player2";
			client.send(message);
		});
		$("#player-0-game").click(function(){
			message = new Paho.MQTT.Message("0");
			message.destinationName = "/point";
			client.send(message);
		});
		$("#player-1-game").click(function(){
			message = new Paho.MQTT.Message("1");
			message.destinationName = "/point";
			client.send(message);
		});
		$("#sync-pull").click(function(){
			++pull_count;
			if(pull_count < 3) return;
			pull_count = 0;
			message = new Paho.MQTT.Message(sync_request);
			message.destinationName = "/sync/in";
			client.send(message);
		});
		$("#reset").click(function(){
			++reset_count;
			if(reset_count < 3) return;
			reset_count = 0;
			message = new Paho.MQTT.Message($(this).val());
			message.destinationName = "/reset";
			client.send(message);
		});
	}

	function onConnectionLost(responseObject) {
		if (responseObject.errorCode !== 0) {
			$("#sync-pull").removeClass("led-black").addClass("red-black");
			client.connect({keepAliveInterval:21600,onSuccess:onConnect});
		}
	}

	function onMessageArrived(message) {
		var d = message.destinationName;
		switch(d){
			case "/title":
				$("#match-name").val(message.payloadString);
				break;
			case "/rules":
				rotateRules();
				break;
			case "/clock":
				START = Date.now();
				break;
			case "/serve":
				switchService();
				break;
			case "/sync/out":
				var m = JSON.parse(message.payloadString);
				if(m.clientID == clientID) return;
				if(m.request != null && m.request != sync_request) return; 
				$("#match-name").val(m.title);
				$("#player-0-name").val(m.player1);
				$("#player-1-name").val(m.player2);
				RULES = m.rules;
				START = m.start;
				var l = m.history.length;
				init();	
				updateClock();
				for(var a=0;a<l;a++){
					point(m.history[a]);
				}
				if(server != m.server){
					switchService();
				}
				sync_request = clientID+"."+Date.now();
				break;
			case "/player1":
				$("#player-0-name").val(message.payloadString);
				break;
			case "/player2":
				$("#player-1-name").val(message.payloadString);
				break;
			case "/point":
				point(Number(message.payloadString));
				break;
			case "/sync/in":
				if(message.payloadString == sync_request) return;
				var m = {
					title:$("#match-name").val(),
					player1:$("#player-0-name").val(),
					player2:$("#player-1-name").val(),
					clientID,
					history,
					server,
					rules:RULES,
					start:START,
					request:message.payloadString
				};
				response = new Paho.MQTT.Message(JSON.stringify(m));
				response.destinationName = "/sync/out";
				client.send(response);
				break;
			case "/reset":
				location.reload();
				break;
		}
	}
});
