let Config = {
    startLocation: new V2(6, 3),
    trapLocation: new V2(2, 3),
    mapDim: new V2(7, 6),
    defaultPrompt: "What now?", // znaki nie dzialaja bo np 1 znak '<' ma ';gt' 3 znaki dlogosci w html
    introSong: "intro.mp3",
    allMilestones: 6,
    messageDisplayTime: 800, // ms
    AIStepTime: 850, // ms (should be < messageDisplayTime)
    introSceneDisplayTime: 27000, // ms
    debug: true
}