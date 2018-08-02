let gameState = {
    player: undefined,
    locations: undefined,
    currentLocation: undefined,
    items: undefined,
    UITiles: undefined,
    messageIsDisplayed: {state: false, key: false},
    introIsPlaying: {state: false, scene: 0, setTimeoutIDs: new Array(), f: undefined, audio: undefined},
    lastKeywordIndex: undefined,
    milestoneCount: undefined,
    dragonIsKilled: false,
    UI: false,
    UIOffset: new V2(350, -400),
    UIScale: new V2(130, 110),
    win: false,
    AItimeoutID: undefined,
    actions: undefined,
    capsLetters: true
}

let gs = gameState

let Directions = {
    Uninitialized: -1,
    Up: 0,
    Down: 1,
    Left: 2,
    Right: 3
}

let ErrorCode = {
    ERROR: -1,
    OK: 0,
}

let ItemFlag = {
    STATIC: 0,
    ACTIVE: 1
}

let Word = {
    FIRST: 0,
    SECOND: 1,
    THIRD: 2,
    FOURTH: 3,
    FIFTH: 4
}

function V2(x, y) {
    this.x = x
    this.y = y
}

function Img(src, color) {
    this.src = src
    this.color = color
}

function Location(desc, imgSrc, imgColor, roads, items) {
    this.description = desc
    this.img = new Img(imgSrc, imgColor)
    this.roads = roads
    this.items = items
}

function Item(id, name, description, flags) {
    this.id = id
    this.name = name
    this.description = description
    this.flags = flags
}

let Player = {
    name: "Dratewka",
    equipment: new Array(),
    position: new V2(0, 0)
}

let keywords = [
    "TAKE",
    "DROP",
    "USE",
    "EAST",
    "WEST",
    "NORTH",
    "SOUTH",
    "VOCABULARY",
    "GOSSIPS",
    "AI",
    "RESTART"
]

let locationData = [ // description, imgSrc, imgColor, roads l-left, r-right, u-up, d-down separated by ":"
    "You are inside a brimstone mine", "11.gif", "rgb(235,211,64)", "r",
    "You are at the entrance to the mine", "12.gif", "rgb(89,93,87)", "l:r",
    "A hill", "13.gif", "rgb(117,237,243)", "l:r:d",
    "Some bushes", "14.gif", "rgb(202,230,51)", "l:r",
    "An old deserted hut", "15.gif", "rgb(220,204,61)", "l:r",
    "The edge of a forest", "16.gif", "rgb(167,245,63)", "l:r",
    "A dark forest", "17.gif", "rgb(140,253,99)", "l:d",

    "A man nearby making tar", "21.gif", "rgb(255,190,99)", "r:d",
    "A timber yard", "22.gif", "rgb(255,190,99)", "l:r:d",
    "You are by a roadside shrine", "23.gif", "rgb(167,245,63)", "l:r:u:d",
    "You are by a small chapel", "24.gif", "rgb(212,229,36)", "l:r",
    "You are on a road leading to a wood", "25.gif", "rgb(167,245,63)", "l:r:d",
    "You are in a forest", "26 i 65.gif", "rgb(167,245,63)", "l:r",
    "You are in a deep forest", "27 i 67.gif", "rgb(140,253,99)", "l:u",

    "You are by the Vistula River", "31.gif", "rgb(122,232,252)", "r:u",
    "You are by the Vistula River", "32.gif", "rgb(140,214,255)", "l:u",
    "You are on a bridge over river", "33.gif", "rgb(108,181,242)", "u:d",
    "You are by the old tavern", "34.gif", "rgb(255,189,117)", "r",
    "You are at the town's end", "35.gif", "rgb(255,190,99)", "l:u:d",
    "You are in a butcher's shop", "36.gif", "rgb(255,188,102)", "d",
    "You are in a cooper's house", "37.gif", "rgb(255,188,102)", "d",

    "You are in the Wawel Castle", "41.gif", "rgb(255,176,141)", "r",
    "You are inside a dragon's cave", "42.gif", "rgb(198,205,193)", "l:r",
    "A perfect place to set a trap", "43.gif", "rgb(255,176,141)", "l:u",
    "You are by the water mill", "44.gif", "rgb(255,190,99)", "r",
    "You are at a main crossroad", "45.gif", "rgb(255,190,99)", "l:r:u:d",
    "You are on a town street", "46.gif", "rgb(255,190,99)", "l:r:u",
    "You are in a frontyard of your house", "47.gif", "rgb(255,190,99)", "l:u:d",

    "x", "x", "x", "x",
    "x", "x", "x", "x",
    "x", "x", "x", "x",
    "You are by a swift stream", "54.gif", "rgb(108,181,242)", "r",
    "You are on a street leading forest", "55.gif", "rgb(255,190,99)", "l:u:d",
    "You are in a woodcutter's backyard", "56.gif", "rgb(255,190,99)", "d",
    "You are in a shoemaker's house", "57.gif", "rgb(254,194,97)", "u",

    "x", "x", "x", "x",
    "x", "x", "x", "x",
    "x", "x", "x", "x",
    "You are in a bleak funeral house", "64.gif", "rgb(254,194,97)", "r",
    "You are on a path leading to the wood", "26 i 65.gif", "rgb(167,245,63)", "l:r:u",
    "You are at the edge of a forest", "66.gif", "rgb(167,245,63)", "l:r:u",
    "You are in a deep forest", "27 i 67.gif", "rgb(140,253,99)", "l"
]

let itemData = [ // id, description, flag, name
    10, "a KEY", 1, "KEY",
    11, "an AXE", 1, "AXE",
    12, "STICKS", 1, "STICKS",
    13, "sheeplegs", 0, "sheeplegs",
    14, "MUSHROOMS", 1, "MUSHROOMS",
    15, "MONEY", 1, "MONEY",
    16, "a BARREL", 1, "BARREL",
    17, "a sheeptrunk", 0, "sheeptrunk",
    18, "BERRIES", 1, "BERRIES",
    19, "WOOL", 1, "WOOL",
    20, "a sheepskin", 0, "sheepskin",
    21, "a BAG", 1, "BAG",
    22, "a RAG", 1, "RAG",
    23, "a sheephead", 0, "sheephead",
    24, "a SPADE", 1, "SPADE",
    25, "SULPHUR", 1, "SULPHUR",
    26, "a solid poison", 0, "solid poison",
    27, "a BUCKET", 1, "BUCKET",
    28, "TAR", 1, "TAR",
    29, "a liquid poison", 0, "liquid poison",
    30, "a dead dragon", 0, "dead dragon",
    31, "a STONE", 1, "STONE",
    32, "a FISH", 1, "FISH",
    33, "a KNIFE", 1, "KNIFE",
    34, "a DRAGONSKIN", 1, "DRAGONSKIN",
    35, "a dragonskin SHOES", 1, "SHOES",
    36, "a PRIZE", 1, "PRIZE",
    37, "a SHEEP", 1, "SHEEP"
]

let itemLocation = [ // location, id
    [new V2(2, 0), 31],
    [new V2(4, 0), 27],
    [new V2(6, 0), 14],
    [new V2(2, 1), 10],
    [new V2(6, 1), 18],
    [new V2(1, 2), 32],
    [new V2(3, 3), 21],
    [new V2(4, 4), 33],
    [new V2(3, 5), 24]
]

let relations = [ // used item (id), location, effect (new item id), description, OK (milestone), new item placement: h - hand, l - land
    10, new V2(5, 4), 11, "You opened a tool shed and took an axe", "X", "h",
    11, new V2(6, 5), 12, "You cut sticks for sheeplegs", "X", "h",
    12, new V2(2, 3), 13, "You prepared legs for your fake sheep", "OK", "l",
    14, new V2(3, 2), 15, "The tavern owner paid you money", "X", "h",
    15, new V2(6, 2), 16, "The cooper sold you a new barrel", "X", "h",
    16, new V2(2, 3), 17, "You made a nice sheeptrunk", "OK", "l",
    18, new V2(5, 2), 19, "The butcher gave you wool", "X", "h",
    19, new V2(2, 3), 20, "You prepared skin for your fake sheep", "OK", "l",
    21, new V2(6, 4), 22, "You used your tools to make a rag", "X", "h",
    22, new V2(2, 3), 23, "You made a fake sheephead", "OK", "l",
    24, new V2(0, 0), 25, "", "OK", "h",
    25, new V2(2, 3), 26, "You prepared a solid poison", "X", "l",
    27, new V2(0, 1), 28, "You got a bucket full of tar", "X", "h",
    28, new V2(2, 3), 29, "You prepared a liquid poison", "OK", "l",
    33, new V2(2, 3), 34, "You cut a piece of dragon's skin", "X", "h",
    34, new V2(6, 4), 35, "You used your tools to make shoes", "X", "h",
    35, new V2(0, 3), 36, "The King is impressed by your shoes", "X", "h",
    37, new V2(2, 3), 30, "", "X", "l"
]

let sceneUrls = [
    "img/intro.jpg",
    "img/intro1.jpg",
    "img/intro2.jpg"
]