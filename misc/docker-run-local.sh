docker run -d --link postgres-container:db --name beapp -e DBHOST=db -e DBPORT=5432 -e DBPASS='My:s3Cr3t/' nodebeapp
docker run -d --link postgres-container:db -p 3000:80 --name beapp -e NODEPORT=80 -e DBHOST=db -e DBPORT=5432 -e DBPASS='My:s3Cr3t/' nodebeapp 
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin XXXXXXXX.dkr.ecr.ca-central-1.amazonaws.com