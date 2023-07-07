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
	var RULES = STANDARD;
	var MAX_SETS = getMaxSets(RULES);
	var MAX_WON_SETS = getMaxWonSets(RULES);

	function updateClock(){
		reset_count = 0;
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

	function sendPing(){
		message = new Paho.MQTT.Message("ping");
		message.destinationName = "/ping/"+clientID;
		client.send(message);
	}

	function onConnect() {
		client.subscribe("/reset");
		client.subscribe("/title");
		client.subscribe("/player1");
		client.subscribe("/player2");
		client.subscribe("/point");
		client.subscribe("/serve");
		client.subscribe("/clock");
		client.subscribe("/rules");
		client.subscribe("/ping/"+clientID);
		setInterval(sendPing,1000);
		$("#match-datetime").click(function(){
			++reset_count;
			if(reset_count == 3){
				message = new Paho.MQTT.Message($(this).val());
				message.destinationName = "/reset";
				client.send(message);
			}
		});
		$("#match-name").change(function(){
			message = new Paho.MQTT.Message($(this).val());
			message.destinationName = "/title";
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
	}

	function onConnectionLost(responseObject) {
		if (responseObject.errorCode !== 0) {
			alert("Connection Lost!");
		}
	}

	function onMessageArrived(message) {
		var d = message.destinationName;
		switch(d){
			case "/reset":
				location.reload();
				break;
			case "/title":
				$("#match-name").val(message.payloadString);
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
			case "/serve":
				switchService();
				break;
			case "/clock":
				START = Date.now();
				break;
			case "/rules":
				rotateRules();
				break;
		}
	}
});
