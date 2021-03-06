let client = AgoraRTC.createClient({ mode: 'rtc', 'codec': 'vp8' })

let config = {
    appid: '',
    token: '',
    uid: null,
    channel: ''
}

let localTracks = {
    audioTrack: null,
    videoTrack: null,
}

let remoteTracks = {}

document.getElementById('join-btn').addEventListener('click', async() => {
    console.log('User Joined Stream')
    await joinStreams()
})

document.getElementById('leave-btn').addEventListener('click', async() => {
    for(trackName in localTracks){
        let track = localTracks[trackName]
        if(trackName){
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }
    await client.leave()
    document.getElementById('user-streams').innerHTML = ''
})

let joinStreams = async() => {

    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);

    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
        client.join(config.appid, config.channel, config.token || null, config.uid || null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
    ])

    let videoPlayer =   `<div class="video-containers" id="video-wrapper-${config.uid}">
                            <p class="user-uid">${config.uid}</p>
                            <div class="video-player player" id="stream-${config.uid}"></div>
                        </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
    localTracks.videoTrack.play(`stream-${config.uid}`)

    await client.publish([localTracks.audioTrack, localTracks.videoTrack])
}

let handleUserLeft = async(user) => {
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`)
}

let handleUserJoined = async(user, mediaType) => {
    console.log('User has Joined our stream')
    remoteTracks[user.uid] = user

    await client.subscribe(user, mediaType)

    if (mediaType === 'video'){
        let videoPlayer =   `<div class="video-containers" id="video-wrapper-${user.uid}">
                                <p class="user-uid">${user.uid}</p>
                                <div class="video-player player" id="stream-${user.uid}"></div>
                            </div>`

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
        user.videoTrack.play(`stream-${user.uid}`)
    }

    if (mediaType === 'audio'){
        user.audioTrack.play()
    }
}