const STANDARD = "sd";
const US_OPEN = "us";
const AUSTRALIA_OPEN = "au";
const ROLAND_GARROS = "rg";
const WIMBLEDON = "wb";
const MATCH_TYPES = [
	STANDARD,
	US_OPEN,
	AUSTRALIA_OPEN,
	ROLAND_GARROS,
	WIMBLEDON
];
const CALLS = ["0","15","30","40","AD"];

function getMaxSets(rules){
	switch(rules){
		case STANDARD:
			return 3:
		case US_OPEN:
		case AUSTRALIA_OPEN:
		case ROLAND_GARROS:
		case WIMBLEDON:
			return 5;
		default:
			return 3;
	}
}

function getMaxWonSets(rules){
	switch(rules){
		case STANDARD:
			return 2:
		case US_OPEN:
		case AUSTRALIA_OPEN:
		case ROLAND_GARROS:
		case WIMBLEDON:
			return 3;
		default:
			return 2;
	}
}

function getPointResults(a,b,t){
	var d = a+(t*1) - b;
	var x = t == true ? 6 : 3;
	var g = (d >= 2 && a >= x);
	var s = false;
	if(g == true) return {a:0,b:0,c:0,d:0,t:false,g,s:true};
	if(t == true){
		++a;
		s = ((a+b)%2) == 1;
		return {a,b,c:a,d:b,t,g,s};
	} 
	switch(a){
		case 3:
			switch(b){
				case 3:
					a = 4;
					break;
				case 4:
					b = 3;
					break;
				default:
					return {a:0,b:0,c:0,d:0,t:false,g:true,s:true};
			}
			break;
		case 4: 
			return {a:0,b:0,c:0,d:0,t:false,g:true,s:true};
		default:
			++a;
	}
	var c = CALLS[a];
	var d = CALLS[b];
	return {a,b,c,d,t,g,s};
}

function getGameResults(a,b,r,z){
	++a;
	var v  = ((a-b) >= 2 && a >= 6);
	var t = false;
	if(v == true) return {a,b,t,s:true};
	switch(r){
		case STANDARD:
		case AUSTRALIA_OPEN:
		case US_OPEN:
			t = a == 6 && b == 6;
			if(t == true) return {a,b,t,s:false};
			if(a == 7) return {a,b,t,s:true};
			return {a,b,t,s:false};
		case WIMBLEDON:
			t = (a == 6 && b == 6 && z < 4) || (a == 12 && b == 12 && z == 4);
			if(t == true) return {a,b,t,s:false};
			if(a == 7 && z < 4) return {a,b,t,s:true};
			if(a == 13 && z == 4) return {a,b,t,s:true};
			return {a,b,t,s:false};
		case ROLAND_GARROS:
			t = (a == 6 && b == 6 && z < 4);
			if(t == true) return {a,b,t,s:false};
			return {a,b,t,s:false};
		default:
			t = (a == 6 && b == 6 && z < 4);
			if(t == true) return {a,b,t,s:false};
			return {a,b,t,s:false};
	}
}
