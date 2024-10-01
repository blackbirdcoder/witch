import kaboom from 'kaboom';

const settings = {
    color: {
        gold: [222, 158, 65],
        accent: [165, 48, 48],
        fill: [23, 32, 56],
        life: [117, 167, 67],
    },
    font: 'PixelifySans-Regular',
    bottleName: 'bottle',
    skullName: 'skull',
    ingredientNames: ['carrot', 'beetroot', 'acorn', 'amanita', 'onion', 'tooth'],
    amountIngredients: { min: 1, max: 2 }, // max 10
    maxBottles: 1, // max 10
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

function Ingredient(settings) {
    this._nicknames = settings.ingredientNames;
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
    this.damageHero = 10;

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
    this._locationZ = -10;

    this.create = function (k) {
        k.loadSprite(this._nickname, `sprites/${this._nickname}.png`);
        return this._nickname;
    };

    this.calculateSpan = function (sceneLength) {
        this._span = Math.ceil(sceneLength / this.size.width);
        return this._span;
    };

    this.helperPlatform = function (k, bgColor, tag) {
        k.add([
            k.pos(0, k.height() - this.size.height),
            k.rect(k.width(), this.size.width),
            k.color(bgColor),
            k.area(),
            k.body({ isStatic: true }),
            k.z(this._locationZ),
            {
                forename: tag,
            },
        ]);
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
    this.fullHealth = 100;
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
    this._potion = 0;

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

    this.makingPotions = function (recipe) {
        const state = { potion: this._potion, reboot: false, newRecipe: false };
        const collections = this.performer.children[0].collectedIngredients;
        let precisionCounter = 0;
        for (const keyRecipe of Object.keys(recipe)) {
            if (collections[keyRecipe] === recipe[keyRecipe]) {
                precisionCounter += 1;
            } else if (collections[keyRecipe] > recipe[keyRecipe]) {
                for (const key of Object.keys(collections)) {
                    collections[key] = 0;
                }
                state['reboot'] = true;
                return state;
            }

            if (precisionCounter === Object.keys(recipe).length) {
                for (const key of Object.keys(collections)) {
                    collections[key] = 0;
                }
                this._potion += 1;
                state['potion'] = this._potion;
                state['newRecipe'] = true;
                return state;
            }
        }
        return state;
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

function UserInterface(settings) {
    this._color = settings.color;
    this._fontName = settings.font;
    this.layerIngredientScale = null;
    this._texts = [];
    this.layerBottlePoison = null;
    this.bottlesCountText = null;
    this._bottleName = settings.bottleName;
    this._skullName = settings.skullName;
    this._layerSkull = null;
    this.healthBar = null;
    this._healthBarBackground = null;
    this._healthBarForeground = null;
    this.healthBarLength = 135;
    this._healthBarSettings = {
        width: this.healthBarLength,
        height: 20,
        position: {
            x: settings.scene.size.width - 143,
            y: 10,
        },
    };
    this._locationZ = 100;
    this.decreaseHealthBar = undefined;
    this._size = {
        width: 64,
        height: 64,
    };

    this.calculationHealthBarReduction = function (damage) {
        this.decreaseHealthBar = this.healthBarLength / damage;
    };

    this.displaySkull = function (k) {
        this._layerSkull.add([k.sprite(this._skullName), k.scale(0.8), k.pos(k.width() - this._size.width * 3, -5)]);
    };

    this.createLayerSkull = function (k) {
        this._layerSkull = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.createLayerIngredientScale = function (k) {
        this.layerIngredientScale = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.createLayerBottlePoison = function (k) {
        this.layerBottlePoison = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.drawHealthBarBackground = function (k) {
        this._healthBarBackground = k.add([
            k.rect(this._healthBarSettings.width, this._healthBarSettings.height),
            k.pos(this._healthBarSettings.position.x, this._healthBarSettings.position.y),
            k.color(this._color.accent),
            k.z(this._locationZ),
        ]);
    };

    this.drawHealthBarForeground = function (k, lengthSegment) {
        this.healthBarForeground = k.add([
            k.rect(lengthSegment, this._healthBarSettings.height),
            k.pos(this._healthBarSettings.position.x, this._healthBarSettings.position.y),
            k.color(this._color.life),
            k.z(this._locationZ),
        ]);
    };

    this.createIngredientUI = function (k, recipe, ingredient, style) {
        style['size'] = 20;
        style['width'] = 200;
        style['align'] = 'left';
        let init = 30;
        let step = 0;
        for (const key of Object.keys(recipe)) {
            this.layerIngredientScale.add([k.sprite(key), k.scale(0.4), k.pos(10, init * step)]);

            const currentText = this.layerIngredientScale.add([
                k.pos(40, (init + 1.2) * step),
                k.text(`[gold]${ingredient[key]}/${recipe[key]}[/gold]`, style),
            ]);

            const tmp = {};
            tmp[key] = currentText;
            this._texts.push(tmp);

            ++step;
        }
    };

    this.refreshIngredientDisplay = function (ingredientName, collectedIngredients, recipe) {
        for (const item of this._texts) {
            if (Object.keys(item)[0] === ingredientName) {
                item[
                    ingredientName
                ].text = `[gold]${collectedIngredients[ingredientName]}/${recipe[ingredientName]}[/gold]`;
            }
        }
    };

    this.createSkull = function (k) {
        k.loadSprite(this._skullName, `sprites/${this._skullName}.png`);
    };

    this.createBottlePoison = function (k) {
        k.loadSprite(this._bottleName, `sprites/${this._bottleName}.png`);
    };

    this.displayBottlePoisons = function (k, style) {
        this.layerBottlePoison.add([k.sprite(this._bottleName), k.scale(0.8), k.pos(k.width() - 64 * 3, 50)]);
        this.layerBottlePoison.add([k.text('[gold]x[/gold]', style), k.pos(k.width() - 150, 70)]);
    };

    this.createCountingBottlePoisons = function (k, bottlePoison, maxBottles, style) {
        style['size'] = 30;
        this.bottlesCountText = this.layerBottlePoison.add([
            k.text(`[gold]${bottlePoison}/${maxBottles}[/gold]`, style),
            k.pos(k.width() - 135, 67),
        ]);
    };
}

function Recipe(settings) {
    this._ingredients = settings.ingredientNames;
    this._recipe = {};

    this.create = function (k) {
        for (const ingredient of this._ingredients) {
            this._recipe[ingredient] = k.randi(settings.amountIngredients.min, settings.amountIngredients.max + 1);
        }
    };

    this.getRecipe = function () {
        return this._recipe;
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
        // maxFPS: 30,
    });
    k.debug.inspect = false; // DEBUG!

    const provideData = {
        textStyle: null,
        ground: undefined,
        ingredientDamage: undefined,
    };

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
        const textStyle = start.getColorText(k, fontMain);
        provideData.textStyle = textStyle;

        k.add([
            k.sprite(pictureNames[0]),
            k.scale(start.scale),
            k.pos(positionalTitlePicture.x, positionalTitlePicture.y),
        ]);
        k.add([k.pos(positionalText.x, positionalText.y), k.text(start.dialog['start'], textStyle)]);
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

        const poisonRecipe = new Recipe(settings);
        poisonRecipe.create(k);
        let recipe = poisonRecipe.getRecipe();

        (function backgroundHandler() {
            const background = new Background();
            const backgroundName = background.create(k);
            k.add([k.sprite(backgroundName), k.scale(background.scale), k.pos(0, 0)]);
        })();

        (function ingredientHandler() {
            const ingredient = new Ingredient(settings);
            const ingredientNames = ingredient.create(k);
            const top = 2;
            provideData.ingredientDamage = ingredient.damageHero;

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
                    {
                        forename: currentIngredientName,
                    },
                ]);

                activeIngredient.onCollide((other) => {
                    k.destroy(activeIngredient);
                });
            });
        })();

        (function groundHandler() {
            const ground = new Ground();
            const groundName = ground.create(k);
            const numberGroundBlocks = ground.calculateSpan(settings.scene.size.width);
            const groundBlockWidth = ground.size.width;

            ground.helperPlatform(k, settings.color.fill, groundName);
            provideData.ground = groundName;

            for (let step = 0; step < numberGroundBlocks; step++) {
                k.add([
                    k.sprite(groundName),
                    k.pos(step * groundBlockWidth, settings.scene.size.height - groundBlockWidth),
                    k.area(),
                    k.body({ isStatic: ground.isStatic }),
                    {
                        forename: groundName,
                    },
                ]);
            }
        })();

        const ui = (function userInterfaceHandler() {
            const userInterface = new UserInterface(settings);
            userInterface.createLayerIngredientScale(k);
            userInterface.createLayerBottlePoison(k);
            userInterface.createBottlePoison(k);
            userInterface.createSkull(k);
            userInterface.createLayerSkull(k);
            userInterface.displaySkull(k);
            userInterface.drawHealthBarBackground(k);
            const healthBarLength = userInterface.healthBarLength;
            userInterface.drawHealthBarForeground(k, healthBarLength);
            userInterface.calculationHealthBarReduction(provideData.ingredientDamage);
            return userInterface;
        })();


        (function playerHandler(ui) {
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
                k.health(player.fullHealth),
                {
                    forename: playerName,
                    bottlePoison: 0,
                },
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
                {
                    forename: player.accessoryName,
                    collectedIngredients: {
                        carrot: 0,
                        beetroot: 0,
                        acorn: 0,
                        amanita: 0,
                        onion: 0,
                        tooth: 0,
                    },
                },
            ]);

            ui.createIngredientUI(k, recipe, player.performer.children[0].collectedIngredients, provideData.textStyle);
            ui.displayBottlePoisons(k, provideData.textStyle);
            ui.createCountingBottlePoisons(
                k,
                player.performer.bottlePoison,
                settings.maxBottles,
                provideData.textStyle
            );

            player.performer.children[0].onCollide((other) => {
                if (other.forename !== playerName) {
                    player.performer.children[0].collectedIngredients[other.forename] += 1;
                    const state = player.makingPotions(recipe);
                    player.performer.bottlePoison = state.potion;
                    ui.refreshIngredientDisplay(
                        other.forename,
                        player.performer.children[0].collectedIngredients,
                        recipe
                    );
                    if (state['reboot']) {
                        k.destroy(ui.layerIngredientScale);
                        ui.createLayerIngredientScale(k);
                        ui.createIngredientUI(
                            k,
                            recipe,
                            player.performer.children[0].collectedIngredients,
                            provideData.textStyle
                        );
                    }
                    if (state['newRecipe']) {
                        k.destroy(ui.bottlesCountText);
                        ui.createCountingBottlePoisons(
                            k,
                            player.performer.bottlePoison,
                            settings.maxBottles,
                            provideData.textStyle
                        );
                        poisonRecipe.create(k);
                        recipe = poisonRecipe.getRecipe();
                        k.destroy(ui.layerIngredientScale);
                        ui.createLayerIngredientScale(k);
                        ui.createIngredientUI(
                            k,
                            recipe,
                            player.performer.children[0].collectedIngredients,
                            provideData.textStyle
                        );

                        if (player.performer.bottlePoison === settings.maxBottles) {
                            console.log('YOU WIN');
                        }
                    }
                }
            });

            player.performer.onCollide((other) => {
                if (other.forename != provideData.ground) {
                    player.performer.hurt(provideData.ingredientDamage);
                    k.destroy(ui.healthBarForeground);
                    ui.drawHealthBarForeground(k, (ui.healthBarLength -= ui.decreaseHealthBar));
                }
            });

            player.performer.onDeath(() => {
                console.log('GAME OVER');
            });

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
        })(ui);
    });
})();
