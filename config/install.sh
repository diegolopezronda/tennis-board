#!/bin/bash
sudo apt update
sudo apt upgrade
sudo apt autoremove
sudo apt install -y nginx mosquitto mosquitto-client libwebsockets-dev build-essential libcjson1 libcjson-dev
sudo cat nginx > /etc/nginx/site-enabled/default 
sudo cat mosquitto.conf > /etc/mosquitto/mosquitto.conf
sudo service mosquitto enable
mkdir /home/pi/.config/lxsession
mkdir /home/pi/.config/lxsession/LXDE-pi
cat autostart > /home/pi/.config/lxsession/LXDE-pi/autostart
