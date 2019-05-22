# video-proxy
A proof of concept using multiple WebRTC connections instead of a TURN server.

## Build

```bash
$ docker build -t video-proxy:latest .
```

## Run

```bash
docker run -it --rm -p 80:4000 video-proxy:latest
```

https://github.com/feross/simple-peer
https://blog.garstasio.com/you-dont-need-jquery/ajax/

## Debug

```bash
$ docker run -it --rm -e "NODE_ENV=development" -p 80:4000 -p 9222:9222 video-proxy:latest /www/node_modules/.bin/nodemon --watch src/ --inspect-brk=0.0.0.0:9222 --nolazy src/app.js
```

or

```bash
$ docker run -it --rm -e "NODE_ENV=development" -p 80:4000 -p 9222:9222 video-proxy:latest /www/node_modules/.bin/nodemon --watch src/ --inspect=0.0.0.0:9222 --nolazy src/app.js
```


## Overview

The blog post [Getting Start with WebRTC](https://www.html5rocks.com/en/tutorials/webrtc/basics/) contains lots of good information about WebRTC.
- The article starts with a [link](https://appr.tc/) to a browser based demo ([src](https://github.com/webrtc/apprtc)). This is just one of many [samples](https://webrtc.github.io/samples/).
- The section on [signaling](https://www.html5rocks.com/en/tutorials/webrtc/basics/#toc-signaling) discusses how to use sockets for signaling. 
- The section [RTCPeerConnection without servers](https://www.html5rocks.com/en/tutorials/webrtc/basics/#toc-sans) demonstrates how to avoid signaling altogether.
- The section [RTCPeerConnection plus servers](https://www.html5rocks.com/en/tutorials/webrtc/basics/#toc-real) discusses the role of STUN and TURN servers and has a link to an [article](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/) with even more detailed information.

## Notes from [WebRTC in the real world: STUN, TURN and signaling](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)

- To test credentials you can use the [candidate gathering sample](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) and check if you get a candidate with type relay.

### Idea

>Are there any off the shelf STUN/TURN servers ready for deployment? See [orchestrating TURN server deployment](https://www.microsoft.com/developerblog/2018/01/29/orchestrating-turn-servers-cloud-deployment/) and [Deploying STUN and TURN servers](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#deploying-stun-and-turn-servers)

- It would also be possible to run a WebRTC endpoint on a server and construct your own redistribution mechanism (a [sample client application](https://code.google.com/p/webrtc/source/browse/#svn%2Ftrunk%2Ftalk) is provided by webrtc.org).

- Since Chrome 31 and Opera 18, a MediaStream from one RTCPeerConnection can be used as the input for another: there's a demo at [simpl.info/multi](http://simpl.info/rtcpeerconnection/multi). This can enable more flexible architectures, since it enables a web app to handle call routing by choosing which other peer to connect to.

### Idea

>Instead of a STUN/TURN server have a WebRTC client in the cloud and have each end connect to it. See [node-webrtc](https://github.com/node-webrtc/node-webrtc) or [mediasoup](https://mediasoup.org/)


## More Notes

- [Learning WebRTC peer-to-peer communication, part 2 – connecting 2 browsers on different devices](https://swizec.com/blog/learning-webrtc-peer-peer-communication-connecting-browsers-different-devices/swizec/8383)
- [Peering Through the WebRTC Fog with SocketPeer](https://hacks.mozilla.org/2015/04/peering-through-the-webrtc-fog-with-socketpeer/)
- [Google Codelab](https://codelabs.developers.google.com/codelabs/webrtc-web/#0)
- [Getting Started with WebRTC](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
- 
#### Dependencies

* [express](https://www.npmjs.com/package/express) - Fast, unopinionated, minimalist web framework for node.
* [http-errors](https://www.npmjs.com/package/http-errors) - Create HTTP errors with ease.
* [simple-peer](https://www.npmjs.com/package/simple-peer) - simple WebRTC wrapper
* [wrtc](https://www.npmjs.com/package/wrtc) - node WebRTC client