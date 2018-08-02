window.onload = startGame

function startGame() {
    let gs = gameState

    generateContainer()
    init(gs)

    function afterIntro() {
        updateScreen(gs)
        get("#container").style.display = "block"
        get("#screen").style.display = "none"

        gs.introIsPlaying.state = false
    }

    playIntro(gs, afterIntro)

    document.body.onkeydown = (e) => {
        let input = e.key

        if (gs.win && e.key == "r") {
            get("#screen").style.display = "none"
            init(gs)
            if (gs.UI) showUI(gs)
        }

        if (gs.introIsPlaying.state) {
            gs.introIsPlaying.scene++
            let timeouts = gs.introIsPlaying.setTimeoutIDs
            for (let i = 0; i < timeouts.length; ++i) {
                clearTimeout(timeouts[i])
            }

            updateIntro(gs, gs.introIsPlaying.audio, gs.introIsPlaying.f)

            return
        }

        if (e.key != "F5" && e.key != "F12" && !e.ai) e.preventDefault()

        if (e.key == "Escape") {
            if (gs.AItimeoutID != undefined) {
                clearInterval(gs.AItimeoutID)
                gs.AItimeoutID = undefined
                return
            } else {
                closeUI(gs)
            }
        }

        if (e.key == "F9") {
            showUI(gs)
            return
        }

        if (gs.messageIsDisplayed.state && !e.ctrlKey && !e.shiftKey ) {
            if (gs.messageIsDisplayed.key) {
                gs.messageIsDisplayed.state = false
                gs.messageIsDisplayed.key = false

                get("#log").style.display = "block"
                document.querySelectorAll(".br")[0].style.display = "block"
                document.querySelectorAll("#prompt p")[0].innerHTML = Config.defaultPrompt
            } else { // block input!
            }
            
            return
        }

        let prompt = document.querySelectorAll("#prompt p")[0]
        let commandLine = prompt.innerHTML
        let command = commandLine.slice(Config.defaultPrompt.length, commandLine.length)
        let words = command.split(" ")

        switch (input) {
            case "ArrowLeft": {
                if (e.shiftKey) {
                    gs.UIOffset.x -= 50
                    showUI(gs)
                } else if (e.ctrlKey) {
                    gs.UIScale.x -= 5
                    showUI(gs)
                } else {
                    prompt.innerHTML = Config.defaultPrompt + "WEST"
                }
            }
            break;

            case "ArrowRight": {
                if (e.shiftKey) {
                    gs.UIOffset.x += 50
                    showUI(gs)
                } else if (e.ctrlKey) {
                    gs.UIScale.x += 5
                    showUI(gs)
                } else {
                    prompt.innerHTML = Config.defaultPrompt + "EAST"
                }
            }
            break;

            case "ArrowUp": {
                if (e.shiftKey) {
                    gs.UIOffset.y -= 50
                    showUI(gs)
                } else if (e.ctrlKey) {
                    gs.UIScale.y -= 5
                    showUI(gs)
                } else {
                    prompt.innerHTML = Config.defaultPrompt + "NORTH"
                }
            }
            break;

            case "ArrowDown": {
                if (e.shiftKey) {
                    gs.UIOffset.y += 50
                    showUI(gs)
                } else if (e.ctrlKey) {
                    gs.UIScale.y += 5
                    showUI(gs)
                } else {
                    prompt.innerHTML = Config.defaultPrompt + "SOUTH"
                }
            }
            break;

            case "Backspace": {
                if (commandLine.length > Config.defaultPrompt.length) {
                    prompt.innerHTML = commandLine.slice(0, commandLine.length - 1)
                }
            } break;

            case "CapsLock": {
                gs.capsLetters = !gs.capsLetters
                console.log(gs.capsLetters)
            } break;

            case "Enter": {
                command = command.trim()
                words = command.split(" ")
                prompt.innerHTML = Config.defaultPrompt

                if (Config.debug) {
                    if (words[0][0] == "!") {
                        let cmd = words.slice(1, words.length).join(" ")
                        displayMessage(gs, eval(cmd), true)
                        return true
                    }
                }

                switch (words[0]) {
                    case "TAKE":
                    case "T": {
                        if (words.length != 2) {
                            displayMessage(gs, "invalid number of arguments!")
                            return false
                        }

                        let itemName = words[1]
                        let itemIndex = -1
                        let found = false

                        if (gs.currentLocation.items.length == 0) {
                            displayMessage(gs, "there are no items in this area!")
                            return false
                        }

                        for (let i = 0; i < gs.items.length; ++i) {
                            if (gs.items[i].name == itemName) {
                                itemID = gs.items[i].id
                                itemIndex = i
                                found = true
                                break;
                            }
                        }

                        if (!found) {
                            displayMessage(gs, "There isn't anything like that here")
                            return false
                        }

                        if (Player.equipment.length > 0) {
                            displayMessage(gs, "You are carrying something")
                            return false
                        }

                        let result = isIn(gs.currentLocation.items, itemIndex)

                        if (result.found) {
                            if (gs.items[itemIndex].flags == ItemFlag.ACTIVE) {
                                Player.equipment.push(itemIndex)
                                gs.currentLocation.items.splice(result.indexes[0], 1)
                                displayMessage(gs, "You are taking " + itemName)
                                setTimeout(() => { updateView(gs) }, 300)
                                setTimeout(() => { updateEquipment(gs) }, 900)
                                
                            } else {
                                displayMessage(gs, "You can't carry it")
                            }
                        } else {
                            displayMessage(gs, "There isn't anything like that here")
                        }

                    } break;

                    case "D":
                    case "DROP": {
                        if (words.length != 2) {
                            displayMessage(gs, "invalid number of arguments!")
                            return false
                        }

                        let itemName = words[1]

                        if (Player.equipment.length == 0) {
                            displayMessage(gs, "You are not carrying anything")
                            return false
                        }

                        if (gs.items[Player.equipment[0]].name != itemName) {
                            displayMessage(gs, "You are not carrying it")
                            return false
                        }

                        let activeItems = 0 // TODO REDUNDANCY
                        for (let i = 0; i < gs.currentLocation.items.length; ++i) {
                            let itemIndex = gs.currentLocation.items[i]
                            if (gs.items[itemIndex].flags == ItemFlag.ACTIVE) {
                                activeItems++
                            }
                        }

                        if (activeItems >= 3) {
                            displayMessage(gs, "You can't store any more here")
                            return false
                        }

                        displayMessage(gs, "You are about to drop " + itemName)
                        gs.currentLocation.items.push(Player.equipment[0])
                        Player.equipment.pop()

                        let equipment = get("#equipment")
                        equipment.innerHTML = "<p>You are carrying nothing</p>"

                        setTimeout(() => { updateView(gs) }, 600)
                    } break;

                    case "U":
                    case "USE": {
                        if (words.length != 2) {
                            displayMessage(gs, "invalid number of arguments!")
                            return false
                        }

                        if (Player.equipment.length == 0) {
                            displayMessage(gs, "You aren't carrying anything")
                            return false
                        }

                        let itemName = words[1]

                        if (gs.items[Player.equipment[0]].name != itemName) {
                            displayMessage(gs, "You aren't carrying anything like that")
                            return false
                        }

                        let playersItemIndex = Player.equipment[0]

                        // SPECIAL EVENTS
                        let specialEvent = true
                        let specialCheck = undefined
                        let specialAction = undefined
                        switch (gs.items[playersItemIndex].id) {
                            case 24: {
                                specialAction = () => {
                                    displayMessage(gs, "You are digging")
                                    setTimeout(() => { displayMessage(gs, "and digging...") }, Config.messageDisplayTime+10)
                                    setTimeout(() => { displayMessage(gs, "That's enough sulphur for you") }, (Config.messageDisplayTime*2)+20)
                                }
                            } break;

                            case 33: {
                                specialCheck = () => {
                                    if (gs.dragonIsKilled) return true
                                    else return false
                                }
                            } break;

                            case 37: {
                                specialAction = () => {
                                    displayMessage(gs, "The dragon noticed your gift...")
                                    setTimeout(() => {
                                        displayMessage(gs, "The dragon ate your sheep and died!")
                                        gs.currentLocation.img.src = "img/dead_dragon.bmp"
                                        gs.dragonIsKilled = true
                                        updateScreen(gs)
                                    }, Config.messageDisplayTime)
                                }
                            } break;

                            default: {
                                specialEvent = false
                            } break;
                        }

                        let relationFound = false
                        for (let i = 0; i < (relations.length/6); ++i) {
                            let index = i*6
                            let usedItemID = index
                            let position = index + 1
                            let newItemID = index + 2
                            let description = index + 3
                            let milestoneFlag = index + 4
                            let destinition = index + 5

                            if (relations[usedItemID] == gs.items[playersItemIndex].id) {
                                if (areEqual(relations[position], gs.player.position)) {
                                    relationFound = true
                                    let ok = false
                                    let newItemIndex = -1  
                                    let found = false

                                    for (let i = 0; i < gs.items.length; ++i) {
                                        if (gs.items[i].id == relations[newItemID]) {
                                            newItemIndex = i
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (!found) {
                                        console.log("ERROR: itemID from 'relations' table not found in 'items' table!")
                                        break;
                                    }

                                    if (specialEvent && specialCheck != undefined) {
                                        if (!specialCheck()) {
                                            displayMessage(gs, "Nothing happened")
                                            break;
                                        }
                                    }

                                    if (relations[destinition] == "h") {
                                        gs.player.equipment[0] = newItemIndex
                                        ok = true
                                    } else if (relations[destinition] == "l") {
                                        if (gs.items[newItemIndex].flags == ItemFlag.ACTIVE) {
                                            if (gs.currentLocation.items.length < 3) {
                                                gs.currentLocation.items.push(newItemIndex)
                                                gs.player.equipment.pop()
                                                ok = true
                                            } else {
                                                displayMessage(gs, "Not enough space!")
                                                break;
                                            }
                                        } else {
                                            gs.currentLocation.items.push(newItemIndex)
                                            gs.player.equipment.pop()
                                            ok = true
                                        }
                                    } else {
                                        cosole.log("ERROR: should be 'h' or 'l', not " + relations[destinition] + " in 'relations' table")
                                        break;
                                    }

                                    if (ok) {
                                        if (specialEvent && specialAction != undefined) {
                                            specialAction()
                                        } else displayMessage(gs, relations[description])

                                        if (relations[newItemID] == getItemAttribute(gs, "id", "name", "PRIZE")) {
                                            console.log("GAME END!")
                                            gs.win = true
                                    
                                            setTimeout(() => {
                                                gs.messageIsDisplayed.state = true
                                                let screen = get("#screen")
                                                screen.style.display = "block"
                                                screen.style.backgroundImage = "url('img/end_screen.jpg')"
                                            }, (Config.messageDisplayTime*2)+400)
                                            break;
                                        }

                                        if (relations[milestoneFlag] == "OK") {
                                            gs.milestoneCount++
                                            console.log("Milestones: " + gs.milestoneCount + " / " + Config.allMilestones)
                                        }

                                        if ((gs.milestoneCount == Config.allMilestones) && areEqual(gs.player.position, Config.trapLocation)) {
                                            relationFound = true
                                            gs.milestoneCount++
                                            // gdy zebrane wszystkie przedmioty (6*OK), new V2(3, 4), 37, Your fake sheep is full of poison and ready to be eaten by the dragon, "X", "h"
                                            let max = gs.currentLocation.items.length
                                            for (let i = 0; i < max; ++i) {
                                                if (gs.items[gs.currentLocation.items[i]].flags == ItemFlag.STATIC && gs.items[gs.currentLocation.items[i]].id != getItemAttribute(gs, "id", "name", "dead dragon")) {
                                                    gs.currentLocation.items.splice(i, 1)
                                                    max--
                                                    i--
                                                }
                                            }

                                            for (let i = 0; i < gs.items.length; ++i) {
                                                if (gs.items[i].id == 37) {
                                                    gs.player.equipment = [i]
                                                    break;
                                                }
                                            }
                                            
                                            setTimeout(() => { displayMessage(gs, "Your fake sheep is full of poison and ready to be eaten by the dragon") }, Config.messageDisplayTime)
                                            setTimeout(() => { updateView(gs) }, 300)
                                            setTimeout(() => { updateEquipment(gs) }, 900)
                                        }

                                        setTimeout(() => { updateEquipment(gs) }, 300)
                                        setTimeout(() => { updateView(gs) }, 900)
                                    }
                                }
                                break;
                            }
                        }

                        if (!relationFound)
                            displayMessage(gs, "Nothing happened")
                    } break;

                    // TODO
                    case "E": case "EAST": if (!movePlayer(gs, Directions.Right, "east")) return false
                    break;

                    case "W": case "WEST": if (!movePlayer(gs, Directions.Left, "west")) return false
                    break;

                    case "N": case "NORTH": if (!movePlayer(gs, Directions.Up, "north")) return false
                    break;

                    case "S": case "SOUTH": if (!movePlayer(gs, Directions.Down, "south")) return false
                    break;

                    case "AI": {
                        let key = "ArrowLeft"
                        let AIEvent = {isTrusted: true, key: key, ctrlKey: false, shiftKey: false, ai: true}
                        let lastUsedItems = new Array()
                        let AISteps = 0
                        let fastAI = false
                        let skip = false

                        if (words.length == 2) {
                            if (words[1].length > 0) {
                                if (words[1] == "FAST") {
                                    fastAI = true
                                } else {
                                    displayMessage(gs, "invalid argument")
                                    return false
                                }
                            }
                        } else if (words.length > 2) {
                            displayMessage(gs, "invalid number of arguments")
                            return false
                        }

                        function AIStep() {            
                            AISteps++
                            skip = false

                            if (gs.win) {
                                gs.actions.push({command: undefined, action: () => { console.log("AI: I'm waiting")}})
                                // clearTimeout(gs.AItimeoutID)
                                return
                            }

                            if (gs.actions.length > 50) {
                                console.log("ERROR: Something is wrong. Too many actions for AI!")
                                clearInterval(timeoutID)
                                return
                            }

                            if (AISteps % 8 == 0 && lastUsedItems.length != 0) lastUsedItems.splice(0, 1)

                            if (gs.actions.length == 0) { // SEARCHING FOR PURPOSE
                                if (gs.player.equipment.length == 0) { // search for item that can be used somewhere
                                    let result = AIGoToNearestItem(gs, gs.actions, lastUsedItems)

                                    if (!result.found) {
                                        lastUsedItems = []
                                        gs.actions = []
                                        return
                                    }

                                    let x = result.foundWhere.x
                                    let y = result.foundWhere.y
                                    let itemIndex = result.itemIndex
                                    lastUsedItems.push(itemIndex)

                                    let wasLastlyUsed = isIn(lastUsedItems, itemIndex)
                                    if (wasLastlyUsed.found && wasLastlyUsed.count >= 2) {
                                        //lastUsedItems.splice(wasLastlyUsed.indexes[0], 1)
                                        skip = true
                                    }

                                    if (!skip) {
                                        let canItemBeUsed = canBeUsed(gs, itemIndex) // TODO REDUNDANCY (function invoked JUST to get WHERE)
                                        let take = "TAKE " + gs.items[itemIndex].name
                                        let use = "USE " + gs.items[itemIndex].name

                                        gs.actions.push({command: take, action: undefined})
                                        gs.actions.push({command: undefined, action: () => {
                                            let foundPath = AIGoToPosition(gs, gs.actions, canItemBeUsed.where.x, canItemBeUsed.where.y, fastAI) // path to use
                                            if (!foundPath) {
                                                gs.actions = []
                                                return
                                            }
                                            gs.actions.push({command: use, action: undefined})
                                        }})
                                    }
                                } else { // player holds something
                                    let itemIndex = gs.player.equipment[0]
                                    let wasLastlyUsed = isIn(lastUsedItems, itemIndex)

                                    if (wasLastlyUsed.found && wasLastlyUsed.count >= 2) {
                                        let dropPlaceFound = AIGoToDropPlace(gs, gs.actions)
                                        if (!dropPlaceFound) {
                                            gs.actions = []
                                            return
                                        }

                                        let command = "DROP " + gs.items[itemIndex].name
                                        gs.actions.push({command: command, action: undefined})
                                        return
                                    }

                                    let canItemBeUsed = canBeUsed(gs, itemIndex)
                                    if (canItemBeUsed.result) {
                                        lastUsedItems.push(itemIndex)
                                        let command = "USE " + gs.items[itemIndex].name
                                        
                                        let foundPath = AIGoToPosition(gs, gs.actions, canItemBeUsed.where.x, canItemBeUsed.where.y, fastAI)
                                        if (!foundPath) {
                                            gs.actions = []
                                            return
                                        }
                                        gs.actions.push({command: command, action: undefined})
                                    } else {
                                        let dropPlaceFound = AIGoToDropPlace(gs, gs.actions)
                                        if (!dropPlaceFound) {
                                            gs.actions = []
                                            return
                                        }
                                        let command = "DROP " + gs.items[itemIndex].name
                                        gs.actions.push({command: command, action: undefined})
                                    }
                                }
                            }
                            
                            if (gs.actions.length > 0) { // DOING
                                if (gs.messageIsDisplayed.state) return
                                let target = gs.actions[0]
                                let actionsCount = gs.actions.length

                                while (target.action != undefined) { // TODO OPTIMIZE
                                    target.action()
                                    if (gs.actions.length > actionsCount) {
                                        let firstTarget = Object.assign({}, target)
                                        gs.actions.splice(0, 1)
                                        if (target.command != undefined) gs.actions.unshift(firstTarget.command)
                                        target = gs.actions[0]
                                    }
                                }

                                if (target.command != undefined) {
                                    document.querySelectorAll("#prompt p")[0].innerHTML = Config.defaultPrompt + target.command
                                    AIEvent.key = "Enter"
                                    let result = document.body.onkeydown(AIEvent)
                                    if (result == false) {
                                        gs.actions = []
                                        return
                                    }
                                }
                                
                                gs.actions.splice(0, 1)
                            }
                        }

                        AIStep()
                        gs.AItimeoutID = setInterval(AIStep, Config.AIStepTime)
                    } break;

                    case "R":
                    case "RESTART": {
                        init(gs)
                        get("#screen").style.display = "none"
                        if (gs.UI) showUI(gs)
                        return
                    }

                    case "?":
                    case "V":
                    case "VOCABULARY": {
                        // TODO SCREEN
                        let msg = "<p>NORTH or N, SOUTH or S</p>" +
                            "<p>WEST or W, EAST or E</p>" +
                            "<p>TAKE (object) or T (object)</p>" +
                            "<p>DROP (object) or D (object)</p>" +
                            "<p>USE (object) or U (object)</p>" +
                            "<p>GOSSIPS or G, VOCABULARY or V</p>"

                        get("#log").style.display = "none"
                        document.querySelectorAll(".br")[0].style.display = "none"
                        displayMessage(gs, msg, true)
                    } break;

                    case "G":
                    case "GOSSIPS": {
                        // TODO SCREEN
                        let msg = "<p>The  woodcutter lost  his home key...</p>" +
                            "<p>The butcher likes fruit... The cooper</p>" +
                            "<p>is greedy... Dratewka plans to make a</p>" +
                            "<p>poisoned  bait for the dragon...  The</p>" +
                            "<p>tavern owner is buying food  from the</p>" +
                            "<p>pickers... Making a rag from a bag...</p>"

                        get("#log").style.display = "none"
                        document.querySelectorAll(".br")[0].style.display = "none"
                        displayMessage(gs, msg, true)
                    } break;

                    default: {
                        displayMessage(gs, "Try another word or V for vocabulary")
                    } break;
                }


                if ((gs.AItimeoutID != undefined) && (!e.ai)) gs.actions = []
            } break;

            case "Escape": {
                prompt.innerHTML = Config.defaultPrompt
            } break;

            case "Tab": {
                switch (words.length) {
                    case 1: {
                        words[0] = words[0].toUpperCase()
                        for (let i = 0; i < keywords.length; ++i) {
                            if (words[0][0] == keywords[i][0]) {
                                prompt.innerHTML = Config.defaultPrompt + keywords[i] + " "
                                break;
                            }
                        }
                    } break;

                    case 2: {
                        words[1] = words[1].toUpperCase()
                        let itemIndex = -1
                        let result = false
                        let fullWord = false

                        if (words[0] == "TAKE") {
                            let activeItemIndexes = new Array()
                            for (let i = 0; i < gs.currentLocation.items.length; ++i) {
                                let index = gs.currentLocation.items[i]
                                if (gs.items[index].flags == ItemFlag.ACTIVE) {
                                    activeItemIndexes.push(index)
                                }

                                if (words[1] == gs.items[index].name) {
                                    fullWord = true
                                    result = true
                                }
                            }

                            if (activeItemIndexes.length == 0) {
                                break;
                            }

                            if (words[1].length > 0 && !fullWord) {
                                let matchingWordsIndex = new Array()
                                let length = words[1].length
                                for (let item = 0; item < activeItemIndexes.length; ++item) {
                                    let match = true
                                    for (let letter = 0; letter < length; ++letter) {
                                        if (gs.items[activeItemIndexes[item]].name[letter] != words[1][letter]) {
                                            match = false
                                        }
                                    }

                                    if (match) {
                                        matchingWordsIndex.push(activeItemIndexes[item])
                                        if (matchingWordsIndex.lenght > 1) break;
                                        itemIndex = matchingWordsIndex[0]
                                        result = true
                                    }
                                }

                                if (matchingWordsIndex.length > 1) { // too much items match!
                                    let p = prompt.innerHTML
                                    prompt.innerHTML = p + "?"
                                    setTimeout(() => {
                                        prompt.innerHTML = p
                                    }, 400)
                                    break;
                                }
                            } else {
                                let whichItemIndex = gs.lastKeywordIndex[Word.SECOND] % activeItemIndexes.length
                                itemIndex = activeItemIndexes[whichItemIndex]
                            }
                        } else if (words[0] == "DROP" || words[0] == "USE") {
                            if (gs.player.equipment.length == 0) {
                                break;
                            }

                            itemIndex = gs.player.equipment[0]

                            let match = true
                            for (let letter = 0; letter < words[1].length; ++letter) {
                                if (gs.items[itemIndex].name[letter] != words[1][letter]) match = false
                            }

                            
                            if (match) result = true
                        } else break;

                        if (words[1] == "" || result) {
                            prompt.innerHTML = Config.defaultPrompt + words[0] + " " + gs.items[itemIndex].name
                            gs.lastKeywordIndex[Word.SECOND]++
                        }
                    } break;
                }
            } break;

            case "Shift":
            case "Control":
            case "Alt":
            case "F1": case "F2": case "F3": case "F4": case "F5": case "F6": case "F7": case "F8": case "F10": case "F11": case "F12": 
            break;

            default: {
                input = input.toLowerCase()
                if (gs.capsLetters || e.shiftKey) input = input.toUpperCase()
                prompt.innerHTML += input
            } break;
        }

        updateUI(gs)
    }
}