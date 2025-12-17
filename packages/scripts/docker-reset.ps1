$services = docker service ls -q
if ($services) { docker service rm $services }

$runningContainers = docker ps -q
if ($runningContainers) { docker kill $runningContainers }

$allContainers = docker ps -a -q
if ($allContainers) { docker rm $allContainers }

$images = docker image ls -q
if ($images) { docker image rm -f $images }

$volumes = docker volume ls -q
if ($volumes) { docker volume rm $volumes }

$networks = docker network ls --filter "type=custom" -q
if ($networks) { docker network rm $networks }