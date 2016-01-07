var map_size = 64;
var tile_width = 70;
var tile_height = 70;
var player_size_x = 10;
var player_size_y = 10;
var playerSpeed = 500;

//var scaleRatio = window.devicePixelRatio / 3;

var current_player = {};

var dungeon = {};
var groundGroup;
var wallGroup;
var player;
var land;
var cursors;


var socket;
var ready = false;

var socketClient = function() {
    console.log("socketClient function");
    socket = io.connect('http://localhost:8080'); 
    current_player.username = prompt('Quel est votre pseudo ?');

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

        //controls
        cursors = game.input.keyboard.createCursorKeys();
    }
}


function update() {

    if(ready) {
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
        }

        if (rightKey)
        {
            //  Move to the right
            console.log("toto");
           // player.body.velocity.x = playerSpeed;
            player.body.velocity.x = playerSpeed;
            player.animations.play('right');
        }

        if (upKey)
        {
            //  Move to the up
            player.body.velocity.y = -playerSpeed;
            player.animations.play('right');
        }

        if (downKey)
        {
            //  Move to the down
            player.body.velocity.y = playerSpeed;
            player.animations.play('right');
        }
        
        if(!(cursors.down.isDown || cursors.up.isDown || cursors.left.isDown || cursors.right.isDown || cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Q) || game.input.keyboard.isDown(Phaser.Keyboard.S)|| game.input.keyboard.isDown(Phaser.Keyboard.D) || game.input.keyboard.isDown(Phaser.Keyboard.Z)))
        {
            //  Stand still
            player.animations.stop();
            player.frame = 4;
        }

        game.physics.arcade.collide(wallGroup, player);
    }

}



function renderMap() {
    groundGroup = game.add.group();
    groundGroup.enableBody = true;
    wallGroup = game.add.group();
    wallGroup.enableBody = true

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

