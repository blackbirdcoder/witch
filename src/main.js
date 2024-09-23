import kaboom from 'kaboom';

const settings = {
    color: { gold: [222, 158, 65], accent: [165, 48, 48], fill: [23, 32, 56] },
    font: 'PixelifySans-Regular',
    scene: {
        size: {
            width: 800,
            height: 600,
        },
        id: 'game',
        scale: 1,
        frequencySpawn: 2,
        gravity: 1600,
    },
};

function Ingredient() {
    this._nicknames = ['carrot', 'beetroot'];
    this._collection = [];
    this.size = {
        width: 64,
        height: 64,
    };
    this.scale = 0.8;
    this.gravityScale = 0.1;
    this.collider = {
        position: { x: 15, y: 12 },
        size: {
            width: 35,
            height: 35,
        },
    };

    this.create = function (k) {
        this._nicknames.forEach((item) => {
            this._collection.push(k.loadSprite(item, `sprites/${item}.png`));
        });
        return this._nicknames;
    };
}

function Ground() {
    this._nickname = 'ground';
    this._span = 0;
    this.size = {
        width: 64,
        height: 64,
    };
    this.isStatic = true;

    this.create = function (k) {
        k.loadSprite(this._nickname, `sprites/${this._nickname}.png`);
        return this._nickname;
    };

    this.calculateSpan = function (sceneLength) {
        this._span = Math.ceil(sceneLength / this.size.width);
        return this._span;
    };
}

function Background() {
    this._nickname = 'background';
    this._size = {
        width: 400,
        height: 300,
    };
    this.scale = 2;

    this.create = function (k) {
        k.loadSprite(this._nickname, `sprites/${this._nickname}.png`);
        return this._nickname;
    };
}

function Player() {
    this._nickname = 'hero';
    this.performer = null;
    this.scale = 2;
    this.body = {
        gravityScale: 2,
        maxVelocity: 700,
        jumpForce: 800,
    };
    this.speed = 100;
    this._cutting = {
        sliceX: 6,
        sliceY: 3,
        anims: {
            idle: {
                from: 0,
                to: 5,
                loop: true,
                speed: 4,
            },
            run: {
                from: 6,
                to: 11,
                loop: true,
            },
            jump: {
                from: 12,
                to: 17,
            },
        },
    };
    this._initialPosition = { x: 0, y: 0 };
    this._size = {
        width: 64,
        height: 64,
    };
    this.colliderPlayer = { pos: { x: 7, y: 0 }, size: { width: 20, height: this._size.height } };
    this.colliderAccessory = { pos: { x: 30, y: 30 }, size: { width: 25, height: 15 }, offset: { x: 2, y: 0 } };
    this.accessoryName = 'pot';
    this.turnCorrectionStatus = {
        right: false,
        left: true,
    };
    this.turnColliderRelocation = {
        left: {
            parent: 38,
            child: 6,
        },
        right: {
            parent: 7,
            child: 30,
        },
    };

    this.create = function (k) {
        k.loadSprite(this._nickname, `sprites/${this._nickname}.png`, this._cutting);
        return this._nickname;
    };

    this.calculateInitialPosition = function (sceneWidth, sceneHeight) {
        this._initialPosition.x = sceneWidth / 2 - this._size.width;
        this._initialPosition.y = sceneHeight - this._size.height * 3;
        return this._initialPosition;
    };
    this.turnStatusSwitch = function () {
        this.turnCorrectionStatus['right'] = !this.turnCorrectionStatus['right'];
        this.turnCorrectionStatus['left'] = !this.turnCorrectionStatus['left'];
    };
}

function ScreenStart(settings) {
    this._pictureTitleSize = {
        width: 350,
        height: 128,
    };
    this._positionalPictureTitle = { x: 0, y: 0 };
    this._pictureControlSize = {
        width: 85,
        height: 115,
    };
    this._fontName = settings.font;
    this._styleText = { size: 30, width: 500, align: 'center' };
    this._positionalText = { x: 0, y: 0 };
    this._color = settings.color;
    this._picturesNames = ['title', 'control'];
    this.scale = 2;
    this.pictureControlIdent = { x: 100, y: 115 };
    this.dialogPosition = { position: { x: 200, y: 390 }, step: 60 };
    this.dialog = {
        start: '[gold]To start the game Press[/gold] [accent]ENTER[/accent]',
        moving: '[gold]Moving[/gold]',
        jump: '[gold]Jump[/gold]',
        restart: '[gold]Restart[/gold]',
    };

    this.create = function (k) {
        for (const item of this._picturesNames) {
            k.loadSprite(item, `sprites/${item}.png`);
        }
        return this._picturesNames;
    };

    this.fontCreate = function (k) {
        k.loadFont(`${this._fontName}`, `fonts/${this._fontName}.ttf`);
        return this._fontName;
    };

    this.getColorText = function (k, fontName = null) {
        this._styleText['font'] = fontName;
        this._styleText['styles'] = {
            gold: (idx, ch) => ({
                color: k.rgb(this._color.gold),
            }),
            accent: (idx, ch) => ({
                color: k.rgb(this._color.accent),
            }),
        };
        return this._styleText;
    };

    this.calculateTextPosition = function (sceneWidth, sceneHeight) {
        this._positionalText.x = sceneWidth / 2 - this._styleText['width'] / 2;
        this._positionalText.y = sceneHeight / 2 - 30;
        return this._positionalText;
    };

    this.calculatePicturePosition = function (sceneWidth) {
        this._positionalPictureTitle.x = (sceneWidth - this._pictureTitleSize.width) / 10;
        return this._positionalPictureTitle;
    };
}

(function main() {
    const k = kaboom({
        width: settings.scene.size.width,
        height: settings.scene.size.height,
        canvas: document.getElementById(settings.scene.id),
        scale: settings.scene.scale,
        global: false,
        background: settings.color.fill,
    });
    k.debug.inspect = false; // DEBUG!

    k.scene('start', () => {
        const start = new ScreenStart(settings);
        const pictureNames = start.create(k);
        const fontMain = start.fontCreate(k);
        const positionalText = start.calculateTextPosition(settings.scene.size.width, settings.scene.size.height);
        const positionalTitlePicture = start.calculatePicturePosition(settings.scene.size.width);
        const positionalControlPicture = {
            x: positionalText.x + start.pictureControlIdent.x,
            y: positionalText.y + start.pictureControlIdent.y,
        };
        const correctionSize = 0.7;

        k.add([
            k.sprite(pictureNames[0]),
            k.scale(start.scale),
            k.pos(positionalTitlePicture.x, positionalTitlePicture.y),
        ]);
        k.add([
            k.pos(positionalText.x, positionalText.y),
            k.text(start.dialog['start'], start.getColorText(k, fontMain)),
        ]);
        k.add([
            k.sprite(pictureNames[1]),
            k.pos(positionalControlPicture.x, positionalControlPicture.y),
            k.scale(start.scale * correctionSize),
        ]);

        for (const key of Object.keys(start.dialog).slice(1)) {
            k.add([
                k.pos(start.dialogPosition.position.x, start.dialogPosition.position.y),
                k.text(start.dialog[key], start.getColorText(k, fontMain)),
            ]);
            start.dialogPosition.position.y += start.dialogPosition.step;
        }

        k.onKeyPress('enter', () => k.go('main'));
    });
    k.go('start');

    k.scene('main', () => {
        k.setGravity(settings.scene.gravity);
        k.onKeyPress('r', () => k.go('main'));

        const provideData = {
            ground: {
                colliderName: undefined,
            },
        };

        (function backgroundHandler() {
            const background = new Background();
            const backgroundName = background.create(k);
            k.add([k.sprite(backgroundName), k.scale(background.scale), k.pos(0, 0)]);
        })();

        (function ingredientHandler() {
            const ingredient = new Ingredient();
            const ingredientNames = ingredient.create(k);
            const top = 2;
            k.loop(settings.scene.frequencySpawn, () => {
                const currentIngredientName = ingredientNames[k.randi(ingredientNames.length)];
                const activeIngredient = k.add([
                    k.sprite(currentIngredientName),
                    k.scale(ingredient.scale),
                    k.pos(
                        k.rand(ingredient.size.width, k.width() - ingredient.size.width),
                        -ingredient.size.height * top
                    ),
                    k.area({
                        shape: new k.Rect(
                            k.vec2(ingredient.collider.position.x, ingredient.collider.position.y),
                            ingredient.collider.size.width,
                            ingredient.collider.size.height
                        ),
                    }),
                    k.body({ gravityScale: ingredient.gravityScale }),
                    currentIngredientName,
                ]);

                activeIngredient.onCollide(provideData.ground.colliderName, () => {
                    k.destroy(activeIngredient);
                });
            });
        })();

        (function groundHandler() {
            const ground = new Ground();
            const groundName = ground.create(k);
            const numberGroundBlocks = ground.calculateSpan(settings.scene.size.width);
            const groundBlockWidth = ground.size.width;

            for (let step = 0; step < numberGroundBlocks; step++) {
                k.add([
                    k.sprite(groundName),
                    k.pos(step * groundBlockWidth, settings.scene.size.height - groundBlockWidth),
                    k.area(),
                    k.body({ isStatic: ground.isStatic }),
                    groundName,
                ]);
            }
            provideData.ground.colliderName = groundName;
        })();

        (function PlayerHandler() {
            const player = new Player();
            const playerName = player.create(k);
            const playerInitPosition = player.calculateInitialPosition(
                settings.scene.size.width,
                settings.scene.size.height
            );

            player.performer = k.add([
                k.sprite(playerName, { anim: 'idle' }),
                k.scale(player.scale),
                k.pos(playerInitPosition.x, playerInitPosition.y),
                k.area({
                    shape: new k.Rect(
                        k.vec2(player.colliderPlayer.pos.x, player.colliderPlayer.pos.y),
                        player.colliderPlayer.size.width,
                        player.colliderPlayer.size.height
                    ),
                }),
                k.body(player.body),
                playerName,
            ]);

            player.performer.add([
                k.pos(0, 0),
                k.area({
                    shape: new k.Rect(
                        k.vec2(player.colliderAccessory.pos.x, player.colliderAccessory.pos.y),
                        player.colliderAccessory.size.width,
                        player.colliderAccessory.size.height
                    ),
                    offset: k.vec2(player.colliderAccessory.offset.x, 0),
                }),
                k.body({ isStatic: true }),
                player.accessoryName,
            ]);

            // TODO: Continue
            k.onCollide(player.accessoryName, 'carrot', () => {});

            k.onKeyDown('left', () => {
                player.performer.flipX = true;
                player.performer.move(-player.speed, 0);
                player.performer.area.shape.pos.x = player.turnColliderRelocation.left.parent;
                player.performer.children[0].area.shape.pos.x = player.turnColliderRelocation.left.child;
            });

            k.onKeyDown('right', () => {
                player.performer.flipX = false;
                player.performer.move(player.speed, 0);
                player.performer.area.shape.pos.x = player.turnColliderRelocation.right.parent;
                player.performer.children[0].area.shape.pos.x = player.turnColliderRelocation.right.child;
            });

            k.onKeyPress('space', () => {
                if (player.performer.isGrounded()) {
                    player.performer.jump();
                }
            });

            ['left', 'right', 'space'].forEach((key) => {
                if (key == 'space') {
                    k.onKeyPress(key, () => {
                        player.performer.play('jump');
                    });
                } else if (key == 'right') {
                    k.onKeyPress(key, () => {
                        player.performer.play('run');

                        if (player.turnCorrectionStatus['right']) {
                            player.performer.pos.x = player.performer.pos.x + player.performer.width;
                            player.turnStatusSwitch();
                        }
                    });
                } else if (key == 'left') {
                    k.onKeyPress(key, () => {
                        player.performer.play('run');

                        if (player.turnCorrectionStatus['left']) {
                            player.performer.pos.x = player.performer.pos.x - player.performer.width;
                            player.turnStatusSwitch();
                        }
                    });
                }

                k.onKeyRelease(key, () => {
                    if (!k.isKeyDown('left') && !k.isKeyDown('right') && !k.isKeyDown('space')) {
                        player.performer.play('idle');
                    }
                });
            });
        })();
    });
})();
