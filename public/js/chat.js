// because of index.html <script src="socket.io/socket.io.js"></script>, chat.js has access to io
const socket = io()    // access to socket -- allows to send & receive events from both server & client

// Element definition [$ is element from DOM]
const $messageForm = document.querySelector('#message-form'); 
const $messageFormInput = $messageForm.querySelector('input'); 
const $messageFormButton = $messageForm.querySelector('button'); 
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')   // location to render the template

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;  // innerHTML needed for Mustache.render
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;  

//Options
    //  Destructuring to capture username & room vars from URL param (e.g. ?username=spyder&room=cats)
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})  // ignoreQueryPrefix removes ? from URL params

const autoscroll = () => {  // will call this after rendering our messages
    const $newMessage = $messages.lastElementChild  // gets last element in div (new msg)

    // height of new message element
    const newMessageStyles = getComputedStyle($newMessage);  
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);  // parseInt to convert 16px to 16;  
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin; 

    // Visible height
    const visibleHeight = $messages.offsetHeight; 

    // Height of messages container
    const containerHeight = $messages.scrollHeight;   // the total height we are able to scroll through

    // How far have I scrolled?  
    const scrollOffset = $messages.scrollTop + visibleHeight;   // .scrollTop is the amount of distance we've scrolled from top to top of scrollbar itself 
    
    // checks if we were at bottom prior to adding most recent msg added
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight  // scroll all the way to bottom
    }
}

// client here receiving data from server (on index.js) 
socket.on('message', (msg) => {     // name 'message' must match exactly w/ name from socket.emit on index.js
    console.log(msg);               // will show on console of localhost:3000 URL
    const html = Mustache.render(messageTemplate, {   // store the final html we will be rendering in browser;  use Mustache library to get this html
        username: msg.username, 
        message: msg.text,   // will be accessed in template as {{message}}
        createdAt: moment(msg.createdAt).format('h:mm a') // https://momentjs.com/ Docs -> Display has various formats
    })   
    $messages.insertAdjacentHTML('beforeend', html)  // add elements inside messages div; beforeend adds to bottom w/in div, afterbegin to top w/in div
    autoscroll(); 
})

// client here receiving data from server (on index.js) 
socket.on('locationMessage', (msg) => {     // name 'locationMessage' must match exactly w/ name from socket.emit on index.js
    console.log(msg);               // will show on console of localhost:3000 URL
    const html = Mustache.render(locationTemplate, {   // store the final html we will be rendering in browser;  use Mustache library to get this html
        username: msg.username, 
        url: msg.url,       // url is shorthand syntax for url: url;  will be accessed in template as {{url}}
        createdAt: moment(msg.createdAt).format('h:mm a') // https://momentjs.com/ Docs -> Display has various formats
    })   
    $messages.insertAdjacentHTML('beforeend', html)   // add elements adjacent to the messages div;  beforeend adds to bottom of div w/in div
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html 
})

// allow client to send data to server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();   // prevents page from doing a full refresh
    $messageFormButton.setAttribute('disabled', 'disabled') // disable submit button 
    //const msg = document.querySelector('#chat_msg').value; 
    const msg = e.target.elements.chat_msg.value;    // e.target is the form;  this is an alternate way of getting this field
    socket.emit('sendMessage', msg, (error) => {  // index.js will have the corresponding listener;  3rd param is acknowledgement callback
        $messageFormButton.removeAttribute('disabled') // enable button 
        $messageFormInput.value = ''; 
        $messageFormInput.focus(); 

        if (error) {
            return console.log(error); 
        }
        console.log('Message delivered...')
    })  
})

// mdn geolocation API -- https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
$sendLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation)  {    // checks if the browser does not have support for this
        return alert('Geolocation is not supported by your browser'); 
    }
    $sendLocationButton.setAttribute('disabled', 'disabled') // disable submit button 
    
    // this function is async but does not currently support Promises, so we can't use async/await 
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, (msg) => {
            $sendLocationButton.removeAttribute('disabled') // enable button 
            if (msg) { 
                console.log(msg) 
            }
        }); 
        
    })
})

// send data to server when someone joins a room;  'join' is event  
socket.emit('join', { username, room }, (error) => {   // callback is acknowledgement function;  destructured object for param 2
    if (error) {
        alert(error)
        location.href = '/'   // redirect to join page 
    }
})  

