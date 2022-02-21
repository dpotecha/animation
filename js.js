const waveSlider = {
  waveSliderOptions: {
    images: ["img/1.jpeg", "img/2.jpeg", "img/3.jpeg"],
    shift: 80,
    dragRatio: 0.1,
    speed: 0.4,
  },
  pixiApp: null,
  waveTicker: null,
  changeSlideEvent: new Event('slideChanged'),
  slidesData: {
    slides: [],
    currentSlideId: 0,
    currentSlide: null,
    startPointerPosition: null,
    startSlidePosition: null,
    slideOpacity: null,
    nextSlide: null,
    nextSlidePosition: null,
    nextSlideOpacity: null,
    prevSlide: null,
    prevSlidePosition: null,
    prevSlideOpacity: null,
    displacementFilters: [],
    displacementSprites: []
  },
  sliderStatus: {
    isUp: false,
    isDown: false,
    isAnimated: false,
  },
  getActualSlidesData: function (event) {
    let slides = this.slidesData.slides;

    this.slidesData.currentSlide = slides[this.slidesData.currentSlideId].slide;

    let currentSlide = this.slidesData.currentSlide;

    this.slidesData.nextSlide =
      currentSlide.slideId != slides.length - 1
        ? slides[currentSlide.slideId + 1].slide
        : slides[0].slide;
    this.slidesData.prevSlide =
      currentSlide.slideId != 0
        ? slides[currentSlide.slideId - 1].slide
        : slides[slides.length - 1].slide;

    let nextSlide = this.slidesData.nextSlide;
    let prevSlide = this.slidesData.prevSlide;

    currentSlide.data = event.data;
    currentSlide.dragging = true;

    // set slides start position
    prevSlide.x = -this.waveSliderOptions.shift;
    nextSlide.x = this.waveSliderOptions.shift;

    // set slides start opacity
    prevSlide.alpha = 0;
    nextSlide.alpha = 0;

    //set slides start offset
    prevSlide.offset = 1;
    nextSlide.offset = 1;

    //get actual position of cursor and slides
    this.slidesData.startPointerPosition = currentSlide.data.getLocalPosition(
      currentSlide.parent
    ).x;
    this.slidesData.startSlidePosition = currentSlide.x;
    this.slidesData.nextSlidePosition = nextSlide.x;
    this.slidesData.prevSlidePosition = prevSlide.x;

    //get actual opacity of slides
    this.slidesData.slideOpacity = currentSlide.alpha;
    this.slidesData.nextSlideOpacity = nextSlide.alpha;
    this.slidesData.prevSlideOpacity = prevSlide.alpha;
  },
  startWaveAnimation: function () {
    this.sliderStatus.isUp = false;
    this.sliderStatus.isDown = true;

    this.slidesData.displacementFilters.forEach((filter, index) => {
      if (!this.sliderStatus.isAnimated) {
        let sprite = this.slidesData.displacementSprites[index];
        let elapsed = 0;
        let animationAmplitude = 250.0;
        this.waveTicker.add((delta) => {
          sprite.y++;
          if (!this.sliderStatus.isUp) {
            elapsed += delta * 5;
          } else {
            elapsed -= delta * 2.5;
          }
          filter.scale.x =
            0.0 + Math.sin(elapsed / animationAmplitude) * 40.0;
            filter.scale.y =
            0.0 + Math.sin(elapsed / animationAmplitude) * 25.0;
          if (sprite.y > sprite.height) {
            sprite.y = 0;
          }
        });
      } else {
        this.waveTicker.start();
      }
    });
    this.sliderStatus.isAnimated = true;
  },
  stopSlidesDrag: function () {
    let currentSlide = this.slidesData.currentSlide;
    let nextSlide = this.slidesData.nextSlide;
    let prevSlide = this.slidesData.prevSlide;
    let currentSlideId = this.slidesData.currentSlideId;
    let slides = this.slidesData.slides;

    currentSlide.dragging = false;
    currentSlide.data = null;

    if (currentSlide.offset > this.waveSliderOptions.dragRatio) {
      //change current slide to the previous one

      currentSlide.offset = 1;
      nextSlide.offset = 1;
      prevSlide.offset = 0;

      gsap.to(currentSlide, {
        alpha: 0,
        x: this.waveSliderOptions.shift,
        duration: this.waveSliderOptions.speed,
      });
      gsap.to(prevSlide, {
        alpha: 1,
        x: 0,
        duration: this.waveSliderOptions.speed,
      });

      this.slidesData.currentSlideId =
        this.slidesData.currentSlideId == 0
          ? slides.length - 1
          : --this.slidesData.currentSlideId;
      
      window.dispatchEvent(this.changeSlideEvent);
    } else if (currentSlide.offset < -this.waveSliderOptions.dragRatio) {
      //change current slide to the next one

      currentSlide.offset = -1;
      nextSlide.offset = 0;

      gsap.to(currentSlide, {
        alpha: 0,
        x: -this.waveSliderOptions.shift,
        duration: this.waveSliderOptions.speed,
      });
      gsap.to(nextSlide, {
        alpha: 1,
        x: 0,
        duration: this.waveSliderOptions.speed,
      });

      this.slidesData.currentSlideId =
        this.slidesData.currentSlideId == slides.length - 1
          ? 0
          : ++this.slidesData.currentSlideId;

      window.dispatchEvent(this.changeSlideEvent);
    } else {
      //reset slides position, current slide doesnt change

      currentSlide.offset = 0;
      gsap.to(currentSlide, {
        alpha: 1,
        x: 0,
        duration: this.waveSliderOptions.speed,
      });

      nextSlide.offset = 1;
      gsap.to(nextSlide, {
        alpha: 0,
        x: this.waveSliderOptions.shift,
        duration: this.waveSliderOptions.speed,
      });

      prevSlide.offset = 1;
      gsap.to(prevSlide, {
        alpha: 0,
        x: -this.waveSliderOptions.shift,
        duration: this.waveSliderOptions.speed,
      });
    }
  },
  stopWaveAnimation: function () {
    this.sliderStatus.isUp = true;
    this.sliderStatus.isDown = false;
    let displacementFilter = this.slidesData.slides[0].slide.filters[0];

    this.waveTicker.add(() => {
      if (displacementFilter.scale.x < 1 && !this.sliderStatus.isDown) {
        this.waveTicker.stop();
      }
    });
  },
  onDragStart: function (event) {
    let slider = waveSlider;

    slider.getActualSlidesData(event);

    slider.startWaveAnimation();
  },
  onDragMove: function () {
    let slider = waveSlider;

    if (!slider.slidesData.currentSlide) return;

    let currentSlide = slider.slidesData.currentSlide;
    let nextSlide = slider.slidesData.nextSlide;
    let prevSlide = slider.slidesData.prevSlide;

    if (currentSlide.dragging) {
      let currentPointerPosition = currentSlide.data.getLocalPosition(
        currentSlide.parent
      ).x;
      let newSlideOffset =
        (currentPointerPosition - slider.slidesData.startPointerPosition) /
        slider.pixiApp.view.width;

      currentSlide.offset = newSlideOffset;
      nextSlide.offset = 1 + newSlideOffset;
      prevSlide.offset = newSlideOffset;

      currentSlide.x = Math.min(slider.waveSliderOptions.shift, Math.max(slider.slidesData.startSlidePosition +
        currentSlide.offset * 2 * slider.waveSliderOptions.shift, -slider.waveSliderOptions.shift));

      nextSlide.x =
        Math.max(slider.slidesData.nextSlidePosition +
        newSlideOffset * 2 * slider.waveSliderOptions.shift, 0);

      prevSlide.x =
        Math.min(slider.slidesData.prevSlidePosition +
        newSlideOffset * 2 * slider.waveSliderOptions.shift, 0);

      currentSlide.alpha =
        slider.slidesData.slideOpacity - Math.abs(currentSlide.offset) * 2;

      nextSlide.alpha =
        (slider.slidesData.nextSlideOpacity + 1 - Math.abs(nextSlide.offset)) * 2;

      prevSlide.alpha = slider.slidesData.prevSlideOpacity + prevSlide.offset;

      console.log(nextSlide.alpha);
    }
  },
  onDragEnd: function () {
    let slider = waveSlider;

    slider.stopSlidesDrag();

    slider.stopWaveAnimation();
  },
  setSliderOptions: function(options){
    let defaultOptions = Object.entries(this.waveSliderOptions);
    let newOptions = Object.entries(options);
    defaultOptions.forEach(([key, value]) => {
      newOptions.forEach(([newKey, newValue]) => {
        if(newKey == key){
          this.waveSliderOptions[key] = newValue;
        }
      })
    });

    
  },
  addDisplacementFilters: function(){
    this.slidesData.slides.forEach(({slide}) => {
      let displacementSprite = PIXI.Sprite.from("img/water.jpeg");
      displacementSprite.texture.baseTexture.wrapMode =
        PIXI.WRAP_MODES.REPEAT;
      let displacementFilter = new PIXI.filters.DisplacementFilter(
        displacementSprite
      );
      displacementFilter.padding = 10;
      displacementFilter.scale.x = 0;
      displacementFilter.scale.y = 0;

      displacementSprite.width = slide.width;
      displacementSprite.height = slide.height;
      displacementSprite.position = slide.position;
      

      this.pixiApp.stage.addChild(displacementSprite);

      slide.filters = [displacementFilter];

      this.slidesData.displacementFilters.push(displacementFilter);
      this.slidesData.displacementSprites.push(displacementSprite);
    });
  },
  waveSliderInit: function (area, options) {
    if(options) this.setSliderOptions(options);

    let windwoWidth = area.getBoundingClientRect().width;
    let windowHeight = area.getBoundingClientRect().height * 0.95;

    this.pixiApp = new PIXI.Application({
      width: windwoWidth,
      height: windowHeight,
    });

    this.waveTicker = new PIXI.Ticker;
    this.waveTicker.start();

    let images = this.waveSliderOptions.images;
    let slides = this.slidesData.slides;
    let app = this.pixiApp;

    area.appendChild(app.view);

    for (let i = images.length - 1; i >= 0; i--) {
      let slide = PIXI.Sprite.from(images[i]);

      slide.width = app.view.width;
      slide.height = app.view.height;

      slide.offset = i == 0 ? 0 : 1;
      slide.slideId = i;

      slide.x = this.waveSliderOptions.shift * slide.offset;

      slide.interactive = true;

      slide.alpha = 1 - Math.abs(slide.offset);

      slide
        .on("pointerdown", this.onDragStart)
        .on("pointermove", this.onDragMove)
        .on("pointerup", this.onDragEnd)
        .on("pointerupoutside", this.onDragEnd);
      
      app.stage.addChild(slide);

      slides.unshift({ slide: slide, id: slide.slideId });
    }

    this.addDisplacementFilters();
  },
};

let wrapper = document.querySelector('.wrapper');

waveSlider.waveSliderInit(wrapper);