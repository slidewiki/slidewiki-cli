FROM node:6-slim

RUN mkdir /nodeApp
WORKDIR /nodeApp

# add source code
ADD . /nodeApp

# package and install tool
RUN npm pack && npm install -g slidewiki-cli-0.0.1.tgz

# clean up
RUN rm -rf /nodeApp/*
