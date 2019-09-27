const $messageForm = document.querySelector('#form')
const $sendMessageButton = $messageForm.querySelector('button')
const $messageInput = $messageForm.querySelector('input')
const $sendLocationButton = document.querySelector('#btn-send-location')
const $messages = document.querySelector('#messages')

//Templates

const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search , {ignoreQueryPrefix: true})

const socket = io()

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href='/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('message', (message) => {
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
    
})

socket.on('locationMessage', (location) => {
    const html = Mustache.render($locationTemplate, {
        username: location.username,
        locationURL: location.location,
        createdAt: moment(location.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
    
})


$sendMessageButton.addEventListener('click', (e) => {
    const message = $messageInput.value
    e.preventDefault()
    
    $sendMessageButton.setAttribute('disabled','disabled')
    socket.emit('text-send', message, (error) => {
        $sendMessageButton.removeAttribute('disabled')
        $messageInput.focus()
        $messageInput.value=""

        if(error){
            return console.log(error)
        }
        console.log('Message delievered')
        
    })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((postition) => {
        $sendLocationButton.removeAttribute('disabled')
        socket.emit('sendLocation', {
            
            latitude: postition.coords.latitude,
            longitude: postition.coords.longitude
        }, (acknowledgement) => {
            if(acknowledgement){
                return console.log('Message delievered')
            }
         
        })
    })
})