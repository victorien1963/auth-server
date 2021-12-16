FROM node:17.1.0

ENV APP_NAME Auth

RUN apt-get update -qqy && \
    apt-get install -y ttf-wqy-microhei && \
    apt-get install -y ttf-wqy-zenhei && \
    apt-get install -y libxss1 && \
    apt-get install -y libxtst6 

WORKDIR /auth-server
COPY . /auth-server
RUN yarn install && \
    if [ -n "${APP_VERSION}" ]; then yarn install --production; fi

EXPOSE 7001
CMD yarn start