(function(exports) {
    "use strict"
    var gameState = null
    var gameScene = null
    var gameOverScene = null
    var gameControlsScene = null

    var eagle = null
    var cats = []
    var far = null
    var mid = null
    var fore = null
    var app = null
    var explodedCatsCount = 0
    const bottom = 350
    const maxExplodedCats = 10

    function Eagle (app) {
        this.anim = null
        this.appHeight = 384
        this.stepDistance = 10
        this.direction = {up:false, down:false,left:false,right:false}
        this.items = {}
        this.container = new PIXI.Container()
        this.createAnimatedSprite(app)
        this.bindKeyboardControls()
        
        return this
    }
    Eagle.prototype.uuidv4 = function() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    }
    Eagle.prototype.addItem = function(item) {
        if (!this.items[item.name]) {
            item.name = this.uuidv4()
            this.items[item.name] = item
            this.container.addChild(item)
        }
    }
    Eagle.prototype.bindKeyboardControls = function() {
        let arrowUp = keyboard("ArrowUp")
        arrowUp.press = () => this.direction.up = true
        arrowUp.release = () => this.direction.up = false

        let arrowDown = keyboard("ArrowDown")
        arrowDown.press = () => this.direction.down = true
        arrowDown.release = () => this.direction.down = false            

        let arrowLeft = keyboard("ArrowLeft")
        arrowLeft.press = () => this.direction.left = true
        arrowLeft.release = () => this.direction.left = false            

        let arrowRight = keyboard("ArrowRight")
        arrowRight.press = () => this.direction.right = true
        arrowRight.release = () => this.direction.right = false            

        let spaceBar = keyboard(" ")
        spaceBar.press = () => {
            this.container.children.forEach((val, i, arr) => {
                cats.push(new FallingCat(this.anim.position.x, this.anim.position.y))
            })
            this.container.removeChildren()
        }
        spaceBar.release = () => {}
    }
    Eagle.prototype.createAnimatedSprite = function(app) {
        var frames = []
        for (var i = 1; i < 4; i++)
            frames.push(PIXI.Texture.fromFrame('flyright_0' + i + '.png'))

        this.anim = new PIXI.extras.AnimatedSprite(frames)
        this.anim.x = app.screen.width / 2
        this.anim.y = app.screen.height / 2
        this.anim.anchor.set(0.5)
        this.anim.animationSpeed = 0.25
        this.anim.play()
        gameScene.addChild(this.anim)
        gameScene.addChild(this.container)

        return this
    }
    Eagle.prototype.update = function() {
        if (this.direction.up) {
            if (this.anim.position.y <= 56) {
                this.anim.position.y = 56
            } else {
                this.anim.position.y -= this.stepDistance
            }
        }
        if (this.direction.down) {
            if(this.anim.position.y >= (this.appHeight-60)) {
                this.anim.position.y = this.appHeight-60
            } else {
                this.anim.position.y += this.stepDistance
            }
        }
        if (this.direction.right) {
            if (this.anim.position.x+this.stepDistance >= window.innerWidth-56) {
                this.anim.position.x = window.innerWidth-56
            } else {
                this.anim.position.x  += this.stepDistance
            }
        } 
        if (this.direction.left) {
            if (this.anim.position.x-this.stepDistance <= 56) {
                this.anim.position.x = 56
            } else {
                this.anim.position.x -= this.stepDistance
            }
        }
        // update items we are carrying
        for (let i = 0, vals = Object.values(this.items); i < vals.length; i++) {
            vals[i].position.y = this.anim.position.y+this.anim.height/5 // try to offset the item's y to simulate carrrying with talons
            vals[i].position.x = this.anim.position.x
        }
    }

    function Cat(app) {
        this.anim = null
        this.createAnimatedSprite(app)
    }
    Cat.prototype.createAnimatedSprite = function(app) {
        var frames = []
        for (var i = 1; i < 4; i++)
            frames.push(PIXI.Texture.fromFrame('catleft_0' + i + '.png'))

        this.anim = new PIXI.extras.AnimatedSprite(frames)
        this.anim.x = app.view.width
        this.anim.y = 335
        this.anim.anchor.set(0.5)
        this.anim.animationSpeed = 0.25
        this.anim.play()
        this.add()

        return this
    }
    Cat.prototype.add = function() {
        cats.push(this)
        gameScene.addChild(this.anim)
    }
    Cat.prototype.remove = function() {
        cats.splice(cats.indexOf(this), 1)
        gameScene.removeChild(this.anim)
    }
    Cat.prototype.update = function() {
        if (this.anim.position.x-5 <= 0) {
            this.anim.position.x -= 5
            this.anim.position.x = app.screen.width-50
        } else {
            this.anim.position.x -= 5
        }
    }

    function FallingCat(x, y) {
        this.removed = false
        this.anim = null
        this.createAnimatedSprite(x, y)
    }
    FallingCat.prototype.createAnimatedSprite = function(x, y) {
        var frames = []
        for (var i = 1; i < 4; i++)
            frames.push(PIXI.Texture.fromFrame('catfwd_0' + i + '.png'))

        this.anim = new PIXI.extras.AnimatedSprite(frames)
        this.anim.x = x
        this.anim.y = y
        this.anim.anchor.set(0.5)
        this.anim.animationSpeed = 0.25
        this.anim.play()

        this.add()
    }
    FallingCat.prototype.add = function() {
        cats.push(this)
        gameScene.addChild(this.anim)        
    }
    FallingCat.prototype.remove = function() {
        this.removed = true
        cats.splice(cats.indexOf(this), 1)
        gameScene.removeChild(this.anim)
    }
    FallingCat.prototype.update = function() {
        if (this.anim.position.y+5 < bottom) {
            this.anim.position.y += 5
        } else if (!this.removed) {
            new Explosion(this.anim.position.x, this.anim.position.y)
            this.remove()
        }
    }

    function Explosion(x, y) {
        this.anim = null
        this.timeout = null
        this.destroyAfter = 200
        this.createAnimatedSprite(x, y)
    }
    Explosion.prototype.createAnimatedSprite = function(x, y) {
        var frames = []
        for (var i = 1; i < 9; i++) {
            frames.push(PIXI.Texture.fromFrame('tile00' + i + '.png'))
        }
        this.anim = new PIXI.extras.AnimatedSprite(frames)
        this.anim.x = x
        this.anim.y = bottom-32
        this.anim.anchor.set(0.5)
        this.anim.animationSpeed = 0.5
        this.anim.play()
        this.add()
    }
    Explosion.prototype.add = function() {
        gameScene.addChild(this.anim)
        this.timeout = setTimeout(() => {this.remove()}, this.destroyAfter)
    }
    Explosion.prototype.remove = function() {
        gameScene.removeChild(this.anim)
        clearTimeout(this.timeout)
        explodedCatsCount++
        if (explodedCatsCount >= maxExplodedCats) {
            // trigger game end
            gameState = end
        }
    }

    // Setup Pixi and load the texture atlas files - call the `setup` function when they've loaded
    PIXI.loader.add("resources/eagledata.json")
    .on("progress", function (loader, resource) {
        
        // Display the file `url` currently being loaded
        console.log("loading: " + resource.url); 
        
        // Display the percentage of files currently loaded
        console.log("progress: " + loader.progress + "%"); 
        
        // If you gave your files names as the first argument 
        // of the `add` method, you can access them like this
        console.log("loading: " + resource.name);
    })
    .load(setup)

    function setup() {

        // Initialize the game sprites, set the `gameState` to `play` and start the 'gameLoop'
        app = new PIXI.Application({
            width: window.innerWidth, 
            height: 384,                       
            antialias: true, 
            transparent: false, 
            resolution: 1, 
            backgroundColor: 0x1c1c1c
        })

        app.stage = new PIXI.Container()
        
        gameScene = new PIXI.Container()
        app.stage.addChild(gameScene)
        
        gameOverScene = new PIXI.Container()
        app.stage.addChild(gameOverScene)

        document.body.appendChild(app.view)
        
        var farTexture = PIXI.Texture.fromImage("resources/sky.png")
        far = new PIXI.extras.TilingSprite(farTexture, window.innerWidth, 384)
        far.position.x = 0
        far.position.y = 0
        far.tilePosition.x = 0
        far.tilePosition.y = 0
        gameScene.addChild(far)
        
        var midTexture = PIXI.Texture.fromImage("resources/forest.png")
        mid = new PIXI.extras.TilingSprite(midTexture, window.innerWidth, 384)
        mid.position.x = 0
        mid.position.y = 128
        mid.tilePosition.x = 0
        mid.tilePosition.y = 0
        gameScene.addChild(mid)

        var foreTexture = PIXI.Texture.fromImage("resources/platform.png")
        fore = new PIXI.extras.TilingSprite(foreTexture, window.innerWidth, 384)
        fore.position.x = 0
        fore.position.y = 160
        fore.tilePosition.x = 0
        fore.tilePosition.y = 0
        gameScene.addChild(fore)

        gameControlsScene = new PIXI.Container()
        app.stage.addChild(gameControlsScene)

        eagle = new Eagle(app)
        
        let messageStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 36,
            fill: "#569cd6",
            stroke: '#569cd6',
            strokeThickness: 2,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
        })
        
        let message = new PIXI.Text("\nControls:\n\n\t[Arrow keys]\n\t[Space bar]\n\nClick anywhere to play!", messageStyle)
        message.position.set(window.innerWidth/2-200, 0)
        
        let clickArea = new PIXI.Graphics()
        clickArea.beginFill(0x1c1c1c)
        clickArea.drawRect(0,0,window.innerWidth, window.innerHeight)
        clickArea.endFill()
        clickArea.interactive = true
        clickArea.on("pointerdown", (e) => {
            setInterval(() => { 
                if (cats.length <= 50) {
                    new Cat(app)
                }
            }, 1500)
            gameControlsScene.visible = false
            gameScene.visible = true
        })
        gameControlsScene.addChild(clickArea)
        gameControlsScene.addChild(message)
        gameControlsScene.visible = true
        gameScene.visible = false


        // trigger game play
        gameState = play

        app.ticker.add((delta) => gameLoop(delta))
    }

    function gameLoop(delta) {
        gameState(delta)
    }
    
    function play(delta) {
        // Move the eagle and contain it inside the screen
        // Move the cats
        // Check for a collision between the cats and the eagle
        // Decide whether the game has been won or lost
        // Change the `gameState` to `end` when the game is finished
        // Runs the current `gameState` in a loop and renders the sprites
        eagle.update()
        cats.forEach((c, i, arr) => {
            c.update()

            if ( c instanceof Cat ) {

                if ( hitTest(eagle.anim, c.anim) ) {      
                    cats.splice(cats.indexOf(c), 1)
                    eagle.addItem(c.anim)
                }
            } 


        })

        // parallax scrollng layers
        far.tilePosition.x -= 0.128
        mid.tilePosition.x -= 0.64
        fore.tilePosition.x -= 2.64
    }
    
    function end() {
        //All the code that should run at the end of the game
        let messageStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 36,
            fill: "#569cd6",
            stroke: '#569cd6',
            strokeThickness: 2,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
          })

        let message = new PIXI.Text("Ok you have hurt enough cats!", messageStyle)
        message.position.set(window.innerWidth/2-250, window.innerHeight/3)

        let clickArea = new PIXI.Graphics()
        clickArea.beginFill(0x1c1c1c)
        clickArea.drawRect(0,0,window.innerWidth, window.innerHeight)
        clickArea.endFill()
        clickArea.interactive = true
        clickArea.on("pointerdown", (e) => {
            gameOverScene.visible = false
            window.location.href = window.location.href
        })
        gameOverScene.addChild(clickArea)
        gameOverScene.addChild(message)
        gameOverScene.visible = true
        gameScene.visible = false
    }
}(window))