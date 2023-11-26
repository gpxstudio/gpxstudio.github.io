#!/bin/sh

if [ -z "$mapboxApiKey" ] 
then
	echo "Please set \$mapboxApiKey"
    exit 1
fi

if [ -z "$openAipKey" ] 
then
	echo "Please set \$openAipKey"
    exit 1
fi

if [ -z "$routing_url" ] 
then
	echo "Please set \$routing_url"
    exit 1
fi

echo "mapboxApiKey is: $mapboxApiKey"
jq '.mapbox = "'$mapboxApiKey'" | .mapbox_dev = "'$mapboxApiKey'" | .openaip = "'$openAipKey'" | .routing_url = "'$routing_url'"' ./res/config.json > ./res/config_new.json && mv ./res/config_new.json ./res/config.json
python3 -m http.server
