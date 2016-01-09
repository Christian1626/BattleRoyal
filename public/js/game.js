var map_size = 64;
var tile_width = 70;
var tile_height = 70;
var player_size_x = 10;
var player_size_y = 10;
var playerSpeed = 500;

//var scaleRatio = window.devicePixelRatio / 3;

var current_player = {};
var enemyPlayer = {};

var bulletVelocity = 700;

var dungeon = {};
var groundGroup;
var wallGroup;
var player;
var land;
var ammo;
var cursors;


var socket;
var ready = false;

//bidouille
var finClick = true;



var socketClient = function() {
    console.log("socketClient function");
    socket = io.connect('http://localhost:8080'); 
    //current_player.username = prompt('Quel est votre pseudo ?');
    current_player.username = "Test";

    //Sending to server 
    socket.emit('new_player',current_player.username);

    //player move
    socket.on('player_move',function(player){
        console.log('un player a bougé: '+player);
    });

    socket.on('current_player',function(player){
        current_player = player;
    });


    //new user
    socket.on('new_player',function(new_player){
        console.log('nouveau client connecté: '+new_player);
        //display new player
        renderNewPlayer(new_player);
        playerManagement();
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
    if(ready) {
        game.world.setBounds(0, 0, map_size*tile_width, map_size*tile_height);
        game.physics.setBoundsToWorld();
        console.log("create");
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        renderMap();
        playerManagement();
		
		
		ammo = game.add.group();
		ammo.enableBody = true

        //controls
        cursors = game.input.keyboard.createCursorKeys();
        game.input.onDown.add(fireRocket, this);
    }
}


function update() {

    if(ready) {
        //physics collision
        game.physics.arcade.collide(wallGroup, player);
        //game.physics.arcade.collide(ammo, player, destroyAmmoAndPlayer); //TODO: collision with enemyPlayer
        game.physics.arcade.collide(ammo, wallGroup, destroyAmmo);

        //input keys
        upKey = cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Z);
        downKey = cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S);
        leftKey = cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Q);
        rightKey = cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D);

    
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;


        if (leftKey)
        {
            //  Move to the left
            player.body.velocity.x = -playerSpeed;
            player.animations.play('left');
            current_player.x = player.body.x;
        }

        if (rightKey)
        {
            //  Move to the right
            player.body.velocity.x = playerSpeed;
            player.animations.play('right');
            current_player.x = player.body.x;
        }

        if (upKey)
        {
            //  Move to the up
            player.body.velocity.y = -playerSpeed;
            player.animations.play('right');
            current_player.x = player.body.y;
        }

        if (downKey)
        {
            //  Move to the down
            player.body.velocity.y = playerSpeed;
            player.animations.play('right');
            current_player.x = player.body.y;
        }
        
        if(!(leftKey || rightKey || upKey || downKey))
        {
            //  Stand still
            player.animations.stop();
            player.frame = 4;
        }


        //TODO: envoyer la position du joueur actuel au serveur
                

    }

}

function destroyAmmo(ammo){
	ammo.kill();
}

function destroyAmmoAndPlayer(ammo,player){
	ammo.kill();
	player.kill();
}

function fireRocket() {
    console.log("fire");
    if(game.input.activePointer.isDown) {
        console.log("shoot a rocke222");
        var missile = ammo.create(player.body.x+1,player.body.y+1,'rocket');    
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
            tileSprite.scale.set(tile_height/10 , tile_height/10 ); //TODO


           // this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }
    }
}

function playerManagement() {
    //place player on random position
    player = game.add.sprite(current_player.x*tile_width, current_player.y*tile_height, 'player');
      toto = game.add.sprite(current_player.x*tile_width+50, current_player.y*tile_height+50, 'player');
    //player.scale.set(0.3 , 0.3 );

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    //TODO: ajouter sprite top & botoom

    game.camera.follow(player);
}

function renderNewPlayer(new_player) {
    //place player on random position
    console.log(new_player);
    new_player = game.add.sprite(new_player.x*tile_width, new_player.y*tile_height, 'player');

    new_player = game.add.sprite(player.x, player.y, 'player');

    //  We need to enable physics on the player
    game.physics.arcade.enable(new_player);

    //  Player physics properties. Give the little guy a slight bounce.
    new_player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    new_player.animations.add('left', [0, 1, 2, 3], 10, true);
    new_player.animations.add('right', [5, 6, 7, 8], 10, true);
    //TODO: ajouter sprite top & botoom

   
}

function random(min,max) {
    return Math.floor(Math.random() * max) + min;
}


