const users = []; 

// 4 new functions -- addUser, removeUser, getUser, getUsersInRoom

const addUser = ({id, username, room}) => {
    // clean the data [convert to lowercase, remove spaces], then validate fields are populated
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if (!username || !room) {  // will also identify username = '' 
        return {
            error: 'Username and Room are required'
        }
    }

    // Check for existing user 
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username  // if trying to add identical user to identical room, then ERROR
    })

    if (existingUser) {
        return { error: 'Username is in use!' }
    }

    // Store user 
    const user = { id, username, room }   // destructured
    users.push(user); 
    return { user }   // returning user property for when things go well
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)   // shorthand index;  findIndex returns index of found item
    if (index !== -1) {
        return users.splice(index, 1)[0]   // .splice to remove users by their index, param '1' is # of items to remove;  [0] returns an object
    }
}

const getUser = (id) => {
    /*const existingUser = users.find((id) => {
        return user.id === id  // if trying to add identical user to identical room, then ERROR
    })
    return { user: existingUser } */
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase(); 
    // const allUsers = users.filter((user) => {
    //     return user.room === room   // returns all users found in room
    // })
    // return  allUsers  
    return users.filter((user) => user.room === room ) 
}

addUser({
    id: 100, 
    username: 'Alvin', 
    room: 'Random'
})

addUser({
    id: 101, 
    username: 'Simon', 
    room: 'Random'
})

addUser({
    id: 102, 
    username: 'Alvin', 
    room: 'Different Room'
})

const user = getUser(101); 
console.log(user); 

const userList = getUsersInRoom('Different Room'); 
console.log(userList); 

/*console.log(users)
const removedUser = removeUser(100); 
console.log(removedUser); 
console.log(users); */


