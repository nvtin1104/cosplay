import GUI from "lil-gui";
import { settings } from "../settings";
import type { SceneManager } from "../scene/SceneManager";
export function debugPanel(manager: SceneManager, container: HTMLElement) {
  const gui = new GUI({ container, title: "Advanced controls", width: 280 });
  const wind = gui.addFolder("Wind");
  wind.add(settings, "windStrength", 0, 2, 0.01).name("Strength");
  wind.add(settings, "windDirection", -1, 1, 0.01).name("Direction");
  wind.add(settings, "windSpeed", 0.1, 2, 0.01).name("Speed");
  wind.add(settings, "turbulence", 0, 1, 0.01).name("Turbulence");
  wind.add(settings, "gustStrength", 0, 2, 0.01).name("Gust");
  const hair = gui.addFolder("Hair");
  hair.add(settings, "hairAmplitude", 0, 36, 0.1).name("Amplitude · px");
  hair.add(settings, "hairFrequency", 0.2, 3, 0.01).name("Frequency");
  hair.add(settings, "rootLock", 0, 1, 0.01).name("Root lock");
  hair.add(settings, "tipInfluence", 0, 1, 0.01).name("Tip influence");
  const eyes = gui.addFolder("Eyes");
  eyes
    .add(
      {
        get artwork() {
          return manager.character.material.uniforms.uHasClosed.value
            ? "Ready"
            : "Closed-eye image needed";
        },
      },
      "artwork",
    )
    .name("Eyelid artwork")
    .listen()
    .disable();
  eyes.add(settings, "blinkEnabled").name("Natural blink");
  eyes.add(settings, "blinkFrequency", 0.3, 2, 0.1).name("Frequency");
  const blinkPreview = eyes
    .add(
      { blink: () => manager.character.blink.trigger(manager.time) },
      "blink",
    )
    .name("Blink now");
  blinkPreview.disable();
  manager.onBlinkArtworkChanged = (ready) => blinkPreview.enable(ready);
  const body = gui.addFolder("Body");
  body.add(settings, "breathingStrength", 0, 2, 0.01).name("Breathing · px");
  body.add(settings, "breathingSpeed", 3, 5, 0.1).name("Cycle · seconds");
  body.add(settings, "idleStrength", 0, 2, 0.01).name("Idle motion");
  const rain = gui.addFolder("Rain");
  rain.add(settings, "rainIntensity", 0, 1, 0.01).name("Amount");
  rain.add(settings, "rainSpeed", 0.1, 3, 0.01).name("Speed");
  rain.add(settings, "rainAngle", -0.5, 0.5, 0.01).name("Angle");
  rain.add(settings, "rainOpacity", 0, 0.8, 0.01).name("Opacity");
  rain.add(settings, "foregroundAmount", 0, 1, 0.01).name("Foreground");
  const scene = gui.addFolder("Scene");
  scene.add(settings, "characterScale", 0.5, 1.5, 0.01).name("Character scale");
  scene.add(settings, "characterX", -0.5, 0.5, 0.01).name("Character X");
  scene.add(settings, "characterY", -0.3, 0.3, 0.01).name("Character Y");
  scene
    .add(settings, "backgroundScale", 1, 1.3, 0.001)
    .name("Background scale");
  scene.add(settings, "parallax", 0, 1, 0.01).name("Parallax");
  scene.add(settings, "mist", 0, 0.5, 0.01).name("Mist");
  const debug = gui.addFolder("Debug");
  debug
    .add(settings, "debug", [
      "Off",
      "Mesh",
      "UV",
      "Hair mask",
      "Eye mask",
      "Body mask",
    ])
    .name("View");
  debug.add(settings, "bounds").name("Character bounds");
  gui.folders.forEach((folder) => folder.close());
  return gui;
}
