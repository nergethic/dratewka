function get(selector) { // TODO robustness!
    let s = selector.split(".")
    let elems
    let className = ""
    if (selector[0] == "#") {
        let id = s[0].substr(1, s[0].length)
        for (let i = 1; i < s.length; ++i) className += "." + s[i]
        if (className == "") elems = document.getElementById(id)
        else elems = document.getElementById(id).querySelectorAll(className)
    } else {
        for (let i = 0; i < s.length; ++i) className += "." + s[i]
        elems = document.querySelectorAll(className)
    }

    return elems
}

function getFirst(selector) {
    return get(selector)[0]
}

function forEach(elems, f) {
    for (let i = 0; i < elems.length; ++i) {
        f(elems[i], i)
    }
}

function isIn(arr, elem) { // linear search
    let indexes = new Array()
    let found = false
    
    for (let i = 0; i < arr.length; ++i)
        if (arr[i] == elem)
            indexes.push(i)

    let count = indexes.length

    if (count != 0)
        found = true

    return { found: found, count: count, indexes: indexes }
}


function areEqual(v1, v2) {
    if (v1.x == v2.x && v1.y == v2.y)
        return true
    else
        return false
}

function generateContainer() { // TODO
    let container = document.createElement("div")
    container.id = "container"

    let screen = document.createElement("div")
    screen.id = "screen"

    let UIContainer = document.createElement("div")
    UIContainer.id = "ui-container"

    let message = document.createElement("div")
    message.id = "message"

    let description = document.createElement("div")
    description.id = "description"
    description.innerHTML = "<p></p>"

    let img = document.createElement("div")
    img.id = "img"

    let compassN = document.createElement("div")
    compassN.id = "compass-north"
    compassN.classList.add("compass-letter")

    let compassS = document.createElement("div")
    compassS.id = "compass-south"
    compassS.classList.add("compass-letter")

    let compassW = document.createElement("div")
    compassW.id = "compass-west"
    compassW.classList.add("compass-letter")

    let compassE = document.createElement("div")
    compassE.id = "compass-east"
    compassE.classList.add("compass-letter")

    let compass = document.createElement("div")
    compass.id = "compass"

    let compassMain = document.createElement("div")
    compassMain.id = "compass-main"

    compass.appendChild(compassMain)
    compass.appendChild(compassN)
    compass.appendChild(compassS)
    compass.appendChild(compassW)
    compass.appendChild(compassE)

    let images = document.createElement("div")
    images.classList.add("images")
    images.appendChild(img)
    images.appendChild(compass)

    let log = document.createElement("div")
    log.id = "log"

    let roads = document.createElement("div")
    roads.id = "roads"
    roads.innerHTML = "<p></p>"

    let view = document.createElement("div")
    view.id = "view"
    view.innerHTML = "<p></p>"

    let equipment = document.createElement("div")
    equipment.id = "equipment"
    equipment.innerHTML = "<p></p>"

    log.appendChild(roads)
    log.appendChild(view)
    log.appendChild(equipment)

    let prompt = document.createElement("div")
    prompt.id = "prompt"
    prompt.innerHTML = "<p>"+ Config.defaultPrompt +"</p>"

    let br = document.createElement("div")
    br.classList.add("br")

    document.body.appendChild(screen)
    document.body.appendChild(UIContainer)
    container.appendChild(message)
    container.appendChild(description)
    container.appendChild(images)
    container.appendChild(log)
    container.appendChild(br)
    container.appendChild(prompt)

    document.body.appendChild(container)
}

function init(gameState) {
    let gs = gameState

    gs.locations = new Array(Config.mapDim.y)
    gs.items = new Array()
    gs.UITiles = new Array(Config.mapDim.y)
    gs.actions = new Array()

    for (let i = 0; i < Config.mapDim.y; ++i) {
        gs.locations[i] = new Array(Config.mapDim.x)
        gs.UITiles[i] = new Array(Config.mapDim.x)
    }


    loadLocations(gs)
    loadItems(gs)

    gs.player = Player
    gs.player.equipment = []
    gs.player.position = Object.assign({}, Config.startLocation)
    gs.currentLocation = gs.locations[gs.player.position.y][gs.player.position.x]
    gs.messageIsDisplayed = {state: false, key: false}
    gs.lastKeywordIndex = [0, 0, 0, 0, 0]
    gs.milestoneCount = 0
    gs.dragonIsKilled = false
    gs.win = false

    if (Config.AIStepTime < (Config.messageDisplayTime+5)) Config.AIStepTime = Config.messageDisplayTime + 10

    // SET ITEMS
    for (let i = 0; i < itemLocation.length; ++i) {
        let pos = itemLocation[i][0]
        let itemID = itemLocation[i][1]
        let itemIndex = -1

        let found = false

        for (let j = 0; j < gs.items.length; ++j) {
            if (gs.items[j].id == itemID) {
                itemIndex = j
                found = true
                break;
            }
        }

        if (found) gs.locations[pos.y][pos.x].items.push(itemIndex)
        else console.log("ERROR: 'items' TABLE DOESN'T CONAINT ITEM WITH ID FROM 'itemLocation' TABLE!")

        let prompt = get("#prompt") // TODO
        prompt.innerHTML = "<p>"+ Config.defaultPrompt +"</p>"

        get("#container").style.display = "block"
        updateScreen(gs)
    }
}

function updateCSS(gameState) {
    let color = gameState.currentLocation.img.color
    let style = document.getElementsByTagName("style")[0]

    style.innerHTML = "p::-moz-selection { background: " + color + "; }" +
        "p::selection { background: " + color + "; }" +
        "p::-o-selection { background: " + color + "; }" +
        "p::-webkit-selection { background: " + color + "; }"
}

function loadLocations(gameState) {
    let offset = 4 // how many elements are in one row in the table 'locations' to skip

    for (let y = 0; y < Config.mapDim.y; ++y) {
        for (let x = 0; x < Config.mapDim.x; ++x) {
            let index = (y * Config.mapDim.x * offset) + (x * offset)
            let desc = locationData[index]
            let imgSrc = "img/" + locationData[index + 1]
            let imgColor = locationData[index + 2]
            let roadsStrings = locationData[index + 3].split(":")
            let roads = new Array()

            for (let i = 0; i < roadsStrings.length; ++i) {
                if (roadsStrings[i] == "l") roads.push(Directions.Left)
                else if (roadsStrings[i] == "r") roads.push(Directions.Right)
                else if (roadsStrings[i] == "u") roads.push(Directions.Up)
                else if (roadsStrings[i] == "d") roads.push(Directions.Down)
            }

            gameState.locations[y][x] = new Location(desc, imgSrc, imgColor, roads, new Array())
        }
    }
}

function loadItems(gameState) {
    let offset = 4

    for (let i = 0; i < (itemData.length / offset); ++i) {
        let index = i * offset
        let id = itemData[index]
        let name = itemData[index + 3]
        let description = itemData[index + 1]
        let flag = parseInt(itemData[index + 2])

        gameState.items[i] = new Item(id, name, description, flag)
    }
}

function getItemAttribute(gameState, wantedAttribute, givenAttribute, value) {
    let gs = gameState
    let result = undefined

    for (let i = 0; i < gs.items.length; ++i) {
        if (gs.items[i][givenAttribute] == value) {
            result = gs.items[i][wantedAttribute]
            break;
        } 
    }

    return result
}

function displayMessage(gameState, msg, confirm) {
    let gs = gameState
    if (confirm == undefined) confirm = false
    gs.messageIsDisplayed.state = true

    let message = document.querySelectorAll("#prompt p")[0]

    if (confirm) {
        gs.messageIsDisplayed.key = true
        message.innerHTML = msg + "<p>Press any key</p>"
    } else {
        message.innerHTML = msg

        setTimeout(() => {
            let message = document.querySelectorAll("#prompt p")[0]
            message.innerHTML = Config.defaultPrompt
            gs.messageIsDisplayed.state = false
        }, Config.messageDisplayTime)
    }
}

function updateView(gameState) {
    let locationItemsNames = ""
    for (let i = 0; i < gameState.currentLocation.items.length; ++i) {
        let itemIndex = gameState.currentLocation.items[i]
        locationItemsNames += gameState.items[itemIndex].description + ", "
    }

    if (locationItemsNames == "") {
        locationItemsNames = "nothing"
    } else {
        locationItemsNames = locationItemsNames.slice(0, -2)
    }

    let view = document.querySelectorAll("#view p")[0]
    view.innerHTML = "You see " + locationItemsNames
}

function updateEquipment(gameState) {
    let equipment = document.querySelectorAll("#equipment p")[0] // TODO abstract it to 'get' function

    let eq = gameState.player.equipment
    let itemName = ""

    if (eq.length > 0) {
        let index = eq[0]
        itemName = gameState.items[index].description
    } else itemName = "nothing"

    equipment.innerHTML = "You are carrying " + itemName
}

function updateScreen(gameState) {
    let gs = gameState
    let loc = gs.currentLocation

    let img = get("#img")
    let description = document.querySelectorAll("#description p")[0]
    let roads = document.querySelectorAll("#roads p")[0]

    let newBackgroundColor = ""
    let newBackgroundImage = ""
    let newDescription = ""
    let newRoadsInfo = ""

    if (loc.description == undefined || loc.description == "" || loc.description == "x") {
        console.log("Image not found")
        newBackgroundColor = "red"
        newBackgroundImage = "url('img/secret.png')"
        newDescription = "You shouldn't be here"
        setTimeout(() => { moveToNearLocation(gs) }, 800)
    } else {
        newBackgroundColor = loc.img.color
        newBackgroundImage = "url('" + loc.img.src + "')"
        newDescription = loc.description

        // let west = true
        // if (areEqual(gs.player.position, new V2(1, 3)) && !gs.dragonIsKilled) west = false
        if (isIn(loc.roads, Directions.Left).found)  { newRoadsInfo += "WEST, ";  get("#compass-west").style.display = "block" }  else { get("#compass-west").style.display = "none"}
        if (isIn(loc.roads, Directions.Right).found) { newRoadsInfo += "EAST, ";  get("#compass-east").style.display = "block" }  else { get("#compass-east").style.display = "none"}
        if (isIn(loc.roads, Directions.Up).found)    { newRoadsInfo += "NORTH, "; get("#compass-north").style.display = "block" } else { get("#compass-north").style.display = "none"}
        if (isIn(loc.roads, Directions.Down).found)  { newRoadsInfo += "SOUTH, "; get("#compass-south").style.display = "block" } else { get("#compass-south").style.display = "none"}

        newRoadsInfo = newRoadsInfo.slice(0, -2) // last comma
    }

    if (newRoadsInfo.length == 0) newRoadsInfo = "nowhere"

    img.style.backgroundImage = newBackgroundImage
    img.style.backgroundColor = newBackgroundColor
    description.innerHTML = newDescription
    roads.innerHTML = "You can go " + newRoadsInfo

    updateView(gs)
    updateEquipment(gs)
    updateCSS(gs)
}

function updateLittleUI(gameState) { // TOOD change name
    if (gameState.UI) {
        let tile = gameState.UITiles[gameState.player.position.y][gameState.player.position.x]
        tile.getElementsByClassName("backpack")[0].innerHTML = ""
        tile.style.backgroundImage = ""
        tile.style.backgroundPosition = "2px " + (tile.offsetHeight - 60) + "px"
    }
}

function movePlayer(gameState, direction, directionName) {
    let gs = gameState
    let playerPos = gs.player.position
    let currentPosition = gs.locations[playerPos.y][playerPos.x]

    if (playerPos.x == 1 && playerPos.y == 3 && direction == Directions.Left && !gs.dragonIsKilled) {
        displayMessage(gs, "You can't go that way...")
        setTimeout(() => { displayMessage(gs, "The dragon sleeps in a cave!") }, Config.messageDisplayTime)
        return false
    }

    updateLittleUI(gs)

    if (isIn(currentPosition.roads, direction).found) {
        switch (direction) {
            case Directions.Left: playerPos.x--; break;
            case Directions.Right: playerPos.x++; break;
            case Directions.Up: playerPos.y--; break;
            case Directions.Down: playerPos.y++; break;
            default: console.log("ERROR"); return
        }

        gs.currentLocation = gs.locations[gs.player.position.y][gs.player.position.x]
        updateScreen(gs)

        for (let i = 0; i < gs.lastKeywordIndex.length; ++i) {
            gs.lastKeywordIndex[i] = 0
        }
        
        displayMessage(gs, "You are going " + directionName)
        updateUI(gs)

        return true
    }

    displayMessage(gs, "You can't go that way")
    updateUI(gs)

    return false
}

function updateIntro(gameState, audio, f) {
    let screen = get("#screen")
    let startingScene = gameState.introIsPlaying.scene
    if (startingScene == 3 && f != undefined) {
        audio.pause()
        f()
        return
    }

    for (let i = startingScene; i < 3; ++i) {
        let id = setTimeout(() => {
            screen.style.backgroundImage = "url('" + sceneUrls[i] + "')"
            gameState.introIsPlaying.scene = i
        }, (i - startingScene)*Config.introSceneDisplayTime)

        gameState.introIsPlaying.setTimeoutIDs.push(id)
    }
    
    if (f != undefined) {
        let id = setTimeout(() => { audio.pause(); f() }, Config.introSceneDisplayTime*3)
        gameState.introIsPlaying.setTimeoutIDs.push(id)
    }
}

function playIntro(gameState, f) {
    let gs = gameState
    gs.introIsPlaying.state = true
    gs.introIsPlaying.scene = 0
    gs.introIsPlaying.setTimeoutIDs = []
    gs.introIsPlaying.f = f
    gs.introIsPlaying.audio = new Audio(Config.introSong)
    let audio = gs.introIsPlaying.audio

    audio.play()
    get("#container").style.display = "none"

    updateIntro(gs, audio, f)
}

let tp = teleportPlayer
function teleportPlayer(gameState, x, y) {
    let gs = gameState
    let playerPos = gs.player.position
    if (playerPos.x == x && playerPos.y == y) return

    updateLittleUI(gs)

    playerPos.x = x
    playerPos.y = y
    gs.currentLocation = gs.locations[playerPos.y][playerPos.x]

    updateScreen(gs)
    updateUI(gs)
    
    for (let i = 0; i < gs.lastKeywordIndex.length; ++i) gs.lastKeywordIndex[i] = 0
}

function updateUI(gameState) {
    let gs = gameState
    if (!gs.UI || gs.UI == undefined) {
        closeUI(gs)
        return
    }

    let panel = get("#ui-panel")
    if (panel == null || gs.UITiles[0][0] == undefined) showUI(gs)

    panel.style.left = ((gs.UITiles[0][0].offsetWidth*Config.mapDim.x) + gs.UIOffset.x + 20) + "px"
    panel.style.top = gs.UIOffset.y + "px"
    panel.style.backgroundColor = gs.currentLocation.img.color
    panel.getElementsByClassName("backpack")[0].innerHTML = ""
    panel.getElementsByClassName("ground")[0].innerHTML = ""
    let panelCrafting = panel.getElementsByClassName("crafting")[0]
    panelCrafting.innerHTML = ""
    let panelBackpack = panel.getElementsByClassName("backpack")[0]
    let panelGround = panel.getElementsByClassName("ground")[0]
    panelGround.innerHTML = ""

    let tile = gs.UITiles[gs.player.position.y][gs.player.position.x]
    tile.style.backgroundPosition = "2px " + (tile.offsetHeight - 60) + "px"
    let tileBackpack = tile.getElementsByClassName("backpack")[0]
    tileBackpack.innerHTML = ""

    tile.style.backgroundImage = "url('img/hero.png')"

    for (let i = 0; i < (relations.length/6); ++i) {
        let index = i*6
        let usedItemID = index
        let position = index + 1
        let newItemID = index + 2
        
        if (relations[position].x == gs.player.position.x && relations[position].y == gs.player.position.y) {
            let ingredient, material
            for (let j = 0; j < gs.items.length; ++j) {
                if (gs.items[j].id == relations[usedItemID]) {
                    ingredient = gs.items[j].name
                }

                if (gs.items[j].id == relations[newItemID]) {
                    material = gs.items[j].name
                }
            }

            panelCrafting.innerHTML += ingredient + " --> " + material + "<br>"
        }
    }

    if (gs.player.equipment.length != 0) {
        let itemName = gs.items[gs.player.equipment[0]].name
        tileBackpack.innerHTML = "|" + itemName + "|"
        let color = "#0064C9"
        if (itemName == "PRIZE") color = "#FFED54"
        forEach(document.querySelectorAll(".backpack"), (e) => { e.style.color = color })
        panelBackpack.innerHTML = itemName
    }

    for (let i = 0; i < gs.currentLocation.items.length; ++i) {
        panelGround.innerHTML += gs.items[gs.currentLocation.items[i]].name + "<br>"
    }

    for (let y = 0; y < Config.mapDim.y; ++y) {
        for (let x = 0; x < Config.mapDim.x; ++x) {
            let tile = gs.UITiles[y][x]
            let location = gs.locations[y][x]
            tile.getElementsByClassName("ground")[0].innerHTML = ""
            for (let i = 0; i < location.items.length; ++i) {
                tile.getElementsByClassName("ground")[0].innerHTML += gs.items[location.items[i]].name + "<br>"
            }
        }
    }

    if (panelBackpack.innerHTML == "") panelBackpack.innerHTML = "---"
    if (panelGround.innerHTML == "") panelGround.innerHTML = "---"
}

function showUI(gameState) {
    let gs = gameState

    closeUI(gs)
    gs.UI = true

    let scaleY = gs.UIScale.y
    let scaleX = gs.UIScale.x

    for (let y = 0; y < Config.mapDim.y; ++y) {
        for (let x = 0; x < Config.mapDim.x; ++x) {
            let tile = document.createElement("div")
            let UIContainer = get("#ui-container")
            gs.UITiles[y][x] = tile // tODO redundancy
            tile.classList.add("tile")
            UIContainer.appendChild(tile)

            tile.addEventListener("click", () => {
                teleportPlayer(gs, x, y)
                gs.actions = []
            }, false)

            tile.innerHTML += "<p class='coords'>" + x + " " + y + "</p>" +
                "<p class='backpack'></p>" +
                "<p class='ground'></p>" +
                "<p class='crafting'></p>"

            tile.style.width = scaleX + "px"
            tile.style.height = scaleY + "px"
            tile.style.top = (y*tile.offsetHeight + gs.UIOffset.y) + "px"
            tile.style.left = (x*tile.offsetWidth + gs.UIOffset.x) + "px"

            let location = gs.locations[y][x]
            tile.style.backgroundColor = location.img.color
            tile.style.border = "2px solid " + location.img.color
            
            if (location.description != "x") {
                let colors = location.img.color.match(/\d+/g)
                let rgbDark = new Array()
                let rgbLight = new Array()
                
                forEach(colors, (color) => {
                    let darkColor = parseInt(color - 200)
                    if (darkColor < 0) darkColor = 0
                    rgbDark.push(darkColor)
                    rgbLight.push(darkColor + 100)
                })

                tile.style.color = "rgb(" + rgbDark[0] + ", " + rgbDark[1] + ", " + rgbDark[2] + ")"
                let lightColor = "rgb(" + rgbLight[0] + ", " + rgbLight[1] + ", " + rgbLight[2] + ")"
                tile.getElementsByClassName("coords")[0].style.color = lightColor
                tile.getElementsByClassName("crafting")[0].style.color = lightColor
            }

            let roads = gs.locations[y][x].roads

            let left = false, right = false, top = false, bottom = false
            for (let road = 0; road < roads.length; ++road) {
                if (roads[road] == Directions.Left)  left = true
                if (roads[road] == Directions.Right) right = true
                if (roads[road] == Directions.Up)    top = true
                if (roads[road] == Directions.Down)  bottom = true
            }

            let borderWallStyle = "2px groove black"
            if (!left) tile.style.borderLeft = borderWallStyle
            if (!right) tile.style.borderRight = borderWallStyle
            if (!top) tile.style.borderTop = borderWallStyle
            if (!bottom) tile.style.borderBottom = borderWallStyle

            for (let i = 0; i < (relations.length/6); ++i) {
                let index = i*6
                let usedItemID = index
                let position = index + 1
                let newItemID = index + 2
                
                if (relations[position].x == x && relations[position].y == y) {
                    for (let j = 0; j < gs.items.length; ++j) {
                        if (gs.items[j].id == relations[usedItemID]) {
                            tile.getElementsByClassName("crafting")[0].innerHTML += "-" + gs.items[j].name + "-<br>"
                        }

                        if (gs.items[j].id == relations[newItemID])
                            tile.getElementsByClassName("crafting")[0].innerHTML += "+" + gs.items[j].name + "+<br>"
                    }
                }
            }
        }
    }

    let panel = document.createElement("div")
    panel.id = "ui-panel"
    get("#ui-container").appendChild(panel)

    let width = 250
    panel.style.width = width + "px"
    panel.style.height = (gs.UITiles[0][0].offsetHeight * Config.mapDim.y) + "px"

    panel.innerHTML += "<p class='coords'></p>" +
                "<p class='big'>Crafting</p>" +
                "<p class='crafting'></p>" +
                "<p class='big'>Backpack</p>" +
                "<p class='backpack'></p>" +
                "<p class='big'>Ground</p>" +
                "<p class='ground'></p>"

    updateUI(gs)
}

function closeUI(gameState) {
    gameState.UI = false
    get("#ui-container").remove()
    let UIContainer = document.createElement("div")
    UIContainer.id = "ui-container"
    document.body.appendChild(UIContainer)
}

function canBeUsed(gs, itemIndex) {
    if (gs.items[itemIndex].flags == ItemFlag.ACTIVE) {
        for (let j = 0; j < (relations.length/6); ++j) {
            let index = j*6
            let usedItemID = index
            let position = index + 1
            let newItemID = index + 2
            let description = index + 3
            let milestoneFlag = index + 4
            let destinition = index + 5

            if (gs.items[itemIndex].id == relations[usedItemID]) {
                return {result: true, where: relations[position]}
            }
        }
    }

    return {result: false, where: new V2(-1, -1)}
}

function AIGoToDropPlace(gameState, actions) {
    let gs = gameState
    let found = false
    let newPos = Object.assign({}, gs.player.position)
    let maxCycle = 100

    for (let cycle = 0; (cycle < maxCycle) && (!found); ++cycle) {
        let location = gs.locations[newPos.y][newPos.x] // TODO SOMETIMES ERROR HERE (Cannot read property 'x' of undefined)
        let activeItemCount = 0

        for (let i = 0; i < location.items.length; ++i)
            if (gs.items[location.items[i]].flags == ItemFlag.ACTIVE)
                activeItemCount++

        if (activeItemCount >= 2) { // TODO
            let dir = location.roads[Math.round(Math.random()*(location.roads.length-1))]

            switch (dir) {
                case Directions.Left:  newPos.x--; break;
                case Directions.Right: newPos.x++; break;
                case Directions.Up:    newPos.y--; break;
                case Directions.Down:  newPos.y++; break;
            }
        } else found = true
    }

    if (!found) return false

    AIGoToPosition(gs, actions, newPos.x, newPos.y)

    return true
}

function shuffle(arr) {
  let currentIndex = arr.length
  let buff, randomIndex

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random()*currentIndex)
    currentIndex--

    buff = arr[currentIndex]
    arr[currentIndex] = arr[randomIndex]
    arr[randomIndex] = buff
  }

  return arr
}

let v = () => {visualiseBFS(gs)}
function visualiseBFS(gs) {
    if (gs.UI) {
        let tile = null
        let counter = {ticks: 0}
        let timeOffset = 80
        BFS(gs, (child) => {
            counter.ticks++
            setTimeout(() => {
                let tile = gs.UITiles[child.y][child.x]
                let oldTileTextColor = []
                forEach(tile.querySelectorAll("p"), (e) => { oldTileTextColor.push(e.style.color); e.style.color = "white" })
                let oldBorderColor = tile.style.borderColor
                let oldBgColor = tile.style.backgroundColor
                tile.style.borderColor = "white"
                tile.style.backgroundColor = "#6E44FF"

                setTimeout(() => {
                    tile.style.borderColor = oldBorderColor
                    tile.style.backgroundColor = oldBgColor
                    forEach(tile.querySelectorAll("p"), (e) => { e.style.color = oldTileTextColor.pop() })
                }, timeOffset*25)
            }, counter.ticks*timeOffset, counter)

            return {found: false}
        })
    }
}

function BFS(gameState, condition) {
    let gs = gameState
    let queue = new Array()
    let visited = new Array(Config.mapDim.y)
    let output = new Array()
    let foundWhere = undefined
    let conditionResult = {found: false}

    for (let i = 0; i < visited.length; ++i) {
        visited[i] = new Array(Config.mapDim.x)
        for (let j = 0; j < visited[i].length; ++j)
            visited[i][j] = false
    }

    let child = Object.assign({}, gs.player.position)
    visited[child.y][child.x] = true
    output.push(Object.assign({}, child))

    let maxCycle = 100
    for (let cycle = 0; (!conditionResult.found) && (cycle <= maxCycle); ++cycle) {
        let parent = Object.assign({}, child)
        let location = gs.locations[parent.y][parent.x]
        let roadsCount = location.roads.length

        let randomRoadsOrder = shuffle(location.roads.slice()) // slice makes copy, no pass by reference
        for (let roadIndex = 0; roadIndex < roadsCount; ++roadIndex) {
            let road = randomRoadsOrder[roadIndex] // location.roads[roadIndex]
            child = Object.assign({}, parent)

            switch (road) {
                case Directions.Left:  child.x--; break;
                case Directions.Right: child.x++; break
                case Directions.Up:    child.y--; break;
                case Directions.Down:  child.y++; break;
            }

            if (visited[child.y][child.x]) continue

            if (condition != undefined) {
                conditionResult = condition(child)
                if (conditionResult.found) {
                    foundWhere = Object.assign({}, child)
                    output.push(Object.assign({}, child))
                    break;
                }
            }

            visited[child.y][child.x] = true
            queue.push(Object.assign({}, child))
            output.push(Object.assign({}, child))
        }

        if (queue.length == 0) break;

        child = queue.shift()
    }

    return {found: conditionResult.found, foundWhere: foundWhere, output: output, conditionData: conditionResult}
}

function moveToNearLocation(gameState) {
    let gs = gameState
    let nearestLocation = Object.assign({}, Config.startLocation)
    let min = Math.min(Config.mapDim.x, Config.mapDim.y)

    for (let y = 0; y < Config.mapDim.y; ++y) {
        for (let x = 0; x < Config.mapDim.x; ++x) {
            if (gs.locations[y][x].description != "x") {
                let dtX = x - gs.player.position.x
                let dtY = y - gs.player.position.y

                let val = Math.abs(dtX) + Math.abs(dtY)
                if (val > min) break;
                if (val <= min) if (Math.round(Math.random())) break;
                min = val
                nearestLocation.x = x
                nearestLocation.y = y
            }
        }
    }

    teleportPlayer(gs, nearestLocation.x, nearestLocation.y)
}

function AIGoToNearestItem(gameState, actions, lastUsedItems) {
    let gs = gameState
    let playerPos = gs.player.position
    let itemIndex = undefined

    let condition = (child) => {
        let testLocation = gs.locations[child.y][child.x]
        let result = {found: false, foundItemIndex: undefined}

        for (let i = 0; i < testLocation.items.length; ++i) {
            let itemIndex = testLocation.items[i]
            let isInResult = isIn(lastUsedItems, itemIndex)
            if (canBeUsed(gs, itemIndex).result) {
                if (isInResult.found) {
                    if (isInResult.count == 2) lastUsedItems.push(itemIndex, itemIndex, itemIndex, itemIndex)
                    else if (isInResult.count >= 5) {
                        for (let j = 0; j < isInResult.count; ++j) {
                            lastUsedItems.splice(lastUsedItems[isInResult.indexes[j]], 1)
                        }
                    }
                } else {
                    result.found = true
                    result.foundItemIndex = itemIndex
                    break;
                }
            }
        }

        return result
    }

    let searchResult
    let conditionResult = condition(playerPos)

    if (conditionResult.found) {
        searchResult = {found: true, foundWhere: playerPos, conditionData: conditionResult}
    } else {
        searchResult = BFS(gs, condition)
        createPathCommands(createShortestPathFromBFS(gs, searchResult.output), actions)
    }

    if (searchResult.found) itemIndex = searchResult.conditionData.foundItemIndex

    return {found: searchResult.found, itemIndex: itemIndex, foundWhere: searchResult.foundWhere}
}

function createShortestPathFromBFS(gameState, output) { // create shortest path (directions) from BFS output
    let gs = gameState
    let path = new Array()
    let currentPos = Object.assign({}, output[output.length-1])

    while (!areEqual(currentPos, gs.player.position)) {
        for (let i = 0; i < output.length; ++i) {
            let dtX = output[i].x - currentPos.x
            let dtY = output[i].y - currentPos.y

            if (Math.abs(dtX) == 1 + Math.abs(dtY) < 2) { // TODO optimize?
                let currentLocation = gs.locations[output[i].y][output[i].x]
                let direction = undefined

                if      (dtX == -1) direction = Directions.Right
                else if (dtX == 1)  direction = Directions.Left
                else if (dtY == -1) direction = Directions.Down
                else if (dtY == 1)  direction = Directions.Up

                if (isIn(currentLocation.roads, direction).found) { // can move
                    currentPos = Object.assign({}, output[i])
                    path.unshift(direction)
                    break;
                }
            }
        }
    }

    return path
}

function createPathCommands(path, actions) {
    for (let i = 0; i < path.length; ++i) {
        let command = ""
        let dir = path[i]

        switch (dir) {
            case Directions.Left: command = "WEST"
            break;

            case Directions.Right: command = "EAST"
            break;

            case Directions.Up: command = "NORTH"
            break;

            case Directions.Down: command = "SOUTH"
            break;
        }

        actions.push({command: command, action: undefined})
    }
}

function AIGoToPosition(gameState, actions, toX, toY, fast) { // BFS PATHFINDING
    let gs = gameState

    if (gs.player.position.x == toX && gs.player.position.y == toY) return true
    
    if (fast == undefined) fast = false
    if (fast) {
        actions.push({command: undefined, action: () => { teleportPlayer(gs, toX, toY) }})
        return
    }

    let condition = (child) => {
        let result = {found: false}
        if (child.x == toX && child.y == toY) result.found = true

        return result
    }

    let searchResult = BFS(gs, condition)

    if (searchResult.found)
        createPathCommands(createShortestPathFromBFS(gs, searchResult.output), actions)
    else {
        console.log("Path to "+ toX + " " + toY + " not found")
        searchResult.found = moveToNearLocation(gs)
    }

    return searchResult.found
}