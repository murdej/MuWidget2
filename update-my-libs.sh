if [ "$1" != "" ]
then
	(
		cd "../"$1 || exit
		npm run build
	)
	mkdir -p node_modules/$1/lib node_modules/$1/src
	pwd
	cp -rv "../$1/lib/"* node_modules/$1/lib
	cp -rv "../$1/src/"* node_modules/$1/src
fi