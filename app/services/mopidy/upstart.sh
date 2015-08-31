#!/bin/sh

case "$1" in

	## STATUS OF SERVICE
	'status')

		RESULT=$(sudo service mopidy status)

		case $RESULT in
			*"mopidy is running"* )
				echo '{ "status": 1, "message": "Running" }'
				;;
			*"mopidy is not running"* )
				echo '{ "status": 1, "message": "Not running" }'
				;;
			*)
				echo '{ "status": 0, "message": "Unknown" }'
				;;
		esac
		;;
		
	## START SERVICE
	'start')

		$(sudo service mopidy start)
		echo '{ "status": 1, "message": "Started" }'
		;;
		
	## STOP SERVICE
	'stop')

		$(sudo service mopidy stop)
		echo '{ "status": 1, "message": "Stopped" }'
		;;
		
	## RESTART SERVICE
	'restart')

		RESULT=$(sudo service mopidy restart)
		
		case $RESULT in
			" * Restarting Mopidy music server mopidy [ OK ]" )
				echo '{ "status": 1, "message": "Restarted" }'
				;;
			*)
				echo '{ "status": 0, "message": "Restart failed" }'
				;;
		esac
		;;

	## NO INSTRUCTION PROVIDED
	*)
		echo '{ "status": 0, "message": "No action provided" }'
		;;
	
esac
