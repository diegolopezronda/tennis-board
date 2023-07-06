# tennis-board
Tennis Board for Raspberry Pi

# Dependencies

* NGINX
* Mosquitto
* Chromium

Please execute 


```
sudo apt update; sudo apt upgrade; sudo apt install -y nginx mosquitto mosquitto-client libwebsockets-dev build-essential libcjson1 libcjson-dev
```

# Configuration
## Server
Please place the repository folder on `/var/www/`. You may need to have elevated privileges to do so.

## NGINX
Please configure `/etc/nginx/site-enabled/default` the following way:
```
upstream websocket{
	server localhost:9001;
}

server {
	listen 80 default_server;
	listen [::]:80 default_server;

	root /var/www/tennis-board;
	index index.html index.htm index.nginx-debian.html;

	server_name _;

	location / {
		try_files $uri $uri/ =404;
	}

	location /websocket{
		proxy_pass http://websocket;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
	}
}
```

## Mosquitto
### Enable Mosquitto service
Use `sudo service mosquitto enable`.

### Update init file
Edit `/etc/mosquitto/mosquitto.conf` the following way:
```
# Place your local configuration in /etc/mosquitto/conf.d/
#
# A full description of the configuration file is at
# /usr/share/doc/mosquitto/examples/mosquitto.conf.example

listener 9001
protocol websockets

pid_file /run/mosquitto/mosquitto.pid

persistence true
persistence_location /var/lib/mosquitto/

log_dest file /var/log/mosquitto/mosquitto.log

include_dir /etc/mosquitto/conf.d
allow_anonymous true
```
## Chromium at the startup
Config `~/.config/lxsession/LXDE-pi/autostart` the following way:

```
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --noerrdialogs --disable-infobars --kiosk --use-gl=egl http://localhost &
```
## Restart
With all of this, you should be able to run the board when rebooting with `sudo reboot now`.
