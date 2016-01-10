var map_size = 64;
var tile_width = 70;
var tile_height = 70;
var player_size_x = 10;
var player_size_y = 10;
var playerSpeed = 500;

//var scaleRatio = window.devicePixelRatio / 3;

var current_player = {};
var enemyPlayers;
var playersList ={};
var bulletVelocity = 700;
var id=1;
var dungeon = {};
var groundGroup;
var wallGroup;
var player;
var land;
var ammo;
var cursors;
var bullets;



var socket;
var ready = false;

//bidouille
var finClick = true;



var socketClient = function() {
   // console.log("socketClient function");
    socket = io.connect('http://localhost:8080'); 
    current_player.username = prompt('Quel est votre pseudo ?');
    //current_player.username = "Test";

    //Sending to server 
    socket.emit('new_player',current_player.username);

    //player move
    socket.on('player_move',function(player){
        console.log('un player a bougé: '+player);
    });

    socket.on('current_player',function(player){
        console.log("toto",player);
        current_player = player;
    });

    socket.on('getAllPlayers',function(enemies) {
        console.log("getallplayers");
        

       /* enemyPlayers = game.add.group();
        enemyPlayers.enableBody = true;
        enemyPlayers.physicsBodyType = Phaser.Physics.ARCADE;*/

       for (var id in enemies) {
           renderNewPlayer(enemies[id]);
        }
        
    });

    //new user
    socket.on('new_player',function(new_player){
       // console.log('nouveau client connecté: '+new_player);
        //display new player
        renderNewPlayer(new_player);
        //playerManagement();
    });

    //dungeon
    socket.on('dungeon',function(map){
        console.log('dungeon');
        dungeon = map;
        ready = true;
        create();
    });
}

var game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight* window.devicePixelRatio, 
    Phaser.AUTO, '', { preload: preload, create: socketClient, update: update });

function preload() {
    game.load.image('ground','tiles/ground.jpg');
    game.load.image('wall','tiles/wall.jpg');
    game.load.image('void','tiles/void.jpg');
    game.load.image('rocket','tiles/rocket.png');
    game.load.spritesheet('player', 'sprites/player.png', 32, 48);
}

function create() {
    console.log("create");
    game.world.setBounds(0, 0, map_size*tile_width, map_size*tile_height);
    game.stage.disableVisibilityChange  = true;
    game.physics.setBoundsToWorld();


    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    renderMap();

    player = new Player(current_player.id, game, player);

    console.log("id:",current_player.id)
    
    playersList[current_player.id] = player;
    console.log("player:",playersList[current_player.id])
    current_player = player.player;
    current_player.x = 100;
    current_player.y = 100;

    bullets = current_player.bullets;
	
    game.camera.follow(current_player);
   

    //controls
    cursors = game.input.keyboard.createCursorKeys();
}


function update() {
    if (!ready) return;

    //physics collision
    //game.physics.arcade.collide(wallGroup, current_player);
    //game.physics.arcade.collide(ammo, player, destroyAmmoAndPlayer); //TODO: collision with enemyPlayers
   // game.physics.arcade.collide(ammo, wallGroup, destroyAmmo);

    //input keys
   /* player.input.up  = cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Z);
    player.input.down  = cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S);
    player.input.left  = cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Q);
    player.input.right  = cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D);
    player.input.fire = game.input.activePointer.isDown;
    player.input.tx = game.input.x+ game.camera.x;
    player.input.ty = game.input.y+ game.camera.y;


    current_player.body.velocity.x = 0;
    current_player.body.velocity.y = 0;

     for (var i in playersList)
    {
        if (!playersList[i]) continue;
        var curBullets = playersList[i].bullets;
        var curPlayer = playersList[i].player;
        for (var j in playersList)
        {
            if (!playersList[j]) continue;
            if (j!=i) 
            {
            
                var targetPlayer = playersList[j].player;
                
                game.physics.arcade.overlap(curBullets, targetPlayer, bulletHitPlayer, null, this);
            
            }
            if (playersList[j].alive)
            {
                playersList[j].update();
            }           
        }
    }*/


   /* toto  = new Player(id, game, player);
    toto.player.body.x = current_player.x;
    toto.player.body.y = current_player.y;*/

    current_player.body.velocity.x = 0;
    current_player.body.velocity.y = 0;

    //game.physics.enable(toto) 

     if (cursors.left.isDown)
    {
        //  Move to the left
        current_player.body.velocity.x = -1000;
    }
    if (cursors.right.isDown)
    {
        //  Move to the right
        current_player.body.velocity.x = 1000;
    }
    if (cursors.up.isDown)
    {
        //  Move to the right
        current_player.body.velocity.y = -1000;
    }
    if (cursors.down.isDown)
    {
        //  Move to the right
        current_player.body.velocity.y = 1000;

    }


    //TODO: envoyer la position du joueur actuel au serveur
                


}

function bulletHitPlayer(player, bullet) {
    bullet.kill();
}

function destroyAmmoAndPlayer(ammo,player){
	ammo.kill();
	player.kill();
}

function fireRocket() {
    if(game.input.activePointer.isDown) {
        console.log("shoot a rocke222");
        var missile = ammo.create(current_player.body.x+1,current_player.body.y+1,'rocket');    
        missile.rotation = game.physics.arcade.moveToPointer(missile,bulletVelocity,game.input.activePointer);
         //TODO: envoyer les missiles au server
    }
            
}
	

function renderMap() {
    groundGroup = game.add.group();
    groundGroup.enableBody = true;
    wallGroup = game.add.group();
    wallGroup.enableBody = true;
	

    console.log("RenderMap");
    for (var y = 0; y < dungeon.map_size; y++) {
        for (var x = 0; x < dungeon.map_size; x++) {
            var tileSprite;
            var tile = dungeon.map[x][y];
            if (tile == 0)  {
                tileSprite = game.add.tileSprite(x*tile_width, y*tile_height, 'void');
            }
            else if (tile == 1) {
                tileSprite = groundGroup.create(x*tile_width, y*tile_height,'ground');
                tileSprite.body.immovable = true;
            }
            else {
                tileSprite = wallGroup.create(x*tile_width, y*tile_height,'wall');
                tileSprite.body.immovable = true;
            } 
            tileSprite.scale.set(tile_height/11 , tile_height/11 ); //TODO


           // this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }
    }
}

function playerManagement() {
    console.log("currentplayer:",current_player);

    //place player on random position
    current_player = game.add.sprite(current_player.x, current_player.y, 'player');
    //toto = game.add.sprite(current_player.x*tile_width+50, current_player.y*tile_height+50, 'player');
    //player.scale.set(0.3 , 0.3 );

    //  We need to enable physics on the player
    game.physics.arcade.enable(current_player);

    //  Player physics properties. Give the little guy a slight bounce.
    current_player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    current_player.animations.add('left', [0, 1, 2, 3], 10, true);
    current_player.animations.add('right', [5, 6, 7, 8], 10, true);
    //TODO: ajouter sprite top & botoom


    game.camera.follow(current_player);
}

function renderNewPlayer(new_player) {
    //place player on random position
    console.log("newplayer:",new_player);
    toto  = new Player(id, game, player);
    toto.player.x = new_player.x;
    toto.player.y = new_player.y;
   // game.physics.enable(toto)

    //new_player = game.add.sprite(new_player.x*tile_width, new_player.y*tile_height, 'player');

   /* var titi = game.add.sprite(current_player.x, current_player.y, 'enemy','player');
    var player2 = game.create(new_player.x, new_player.y, 'enemy', 'player');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    //player.animations.add('left', [0, 1, 2, 3], 10, true);
    //player.animations.add('right', [5, 6, 7, 8], 10, true);*/
    //TODO: ajouter sprite top & botoom 
}

function random(min,max) {
    return Math.floor(Math.random() * max) + min;
}






////////////////////////////////////////////////////////////////////////////
//                             PLAYER
////////////////////////////////////////////////////////////////////////////

Player = function (index, game, player) {
    this.cursor = {
        left:false,
        right:false,
        up:false,
        fire:false      
    }

    this.input = {
        left:false,
        right:false,
        up:false,
        fire:false
    }

    var x = 0;
    var y = 0;

    this.game = game;
    this.health = 30;
    this.player = player;

    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);  
    
    
    this.currentSpeed =0;
    this.fireRate = 500;
    this.nextFire = 0;
    this.alive = true;

    this.player = game.add.sprite(x, y, 'player');
    this.player.anchor.set(0.5);

    this.player.id = index;
    game.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.body.immovable = false;
    this.player.body.collideWorldBounds = true;
    this.player.body.bounce.setTo(0, 0);

   //this.player.angle = 0;

    //game.physics.arcade.velocityFromRotation(this.player.rotation, 0, this.player.body.velocity);

};

Player.prototype.update = function() {
    
    var inputChanged = (
        this.cursor.left != this.input.left ||
        this.cursor.right != this.input.right ||
        this.cursor.up != this.input.up ||
        //this.cursor.down != this.input.down ||
        this.cursor.fire != this.input.fire

    );
    
    
    if (inputChanged)
    {
        //Handle input change here
        //send new values to the server     
        if (this.player.id == current_player.id)
        {
            // send latest valid state to the server
            console.log("tititi");
            this.input.x = this.player.x;
            this.input.y = this.player.y;
            //this.input.angle = this.player.angle;
            
            //eurecaServer.handleKeys(this.input); //TODO send input 
            
        }
    }

    //cursor value is now updated by eurecaClient.exports.updateState method
    

    if (cursors.left.isDown)
    {
        //  Move to the left
         console.log("left");
        this.player.body.velocity.x = -700;
    }

    if (this.cursor.right)
    {
        console.log("droite");
        //  Move to the right
        this.player.body.velocity.x = 700;
    }

    if (this.cursor.up)
    {
        //  Move to the up
        this.player.body.velocity.y = -700;
    }

    if (this.cursor.down)
    {
        //  Move to the down
        this.player.body.velocity.y = 700;
    }


    if (this.cursor.fire)
    {   
        this.fire({x:this.cursor.tx, y:this.cursor.ty});
    }
    
};


Player.prototype.fire = function(target) {
        if (!this.alive) return;
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
        {
            this.nextFire = this.game.time.now + this.fireRate;
            var bullet = this.bullets.getFirstDead();
            bullet.reset(this.turret.x, this.turret.y);

            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, target, 500);
        }
}


Player.prototype.kill = function() {
    this.alive = false;
    this.player.kill();
}
