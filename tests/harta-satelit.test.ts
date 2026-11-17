import assert from "node:assert/strict";
import { test } from "node:test";
import { areSatelit, ATRIBUIRE_SATELIT, STRAT_ETICHETE, STRAT_SATELIT } from "../src/components/harta/leaflet";

test("comutatorul Satelit apare doar cu cheie ArcGIS", () => {
  assert.equal(areSatelit(""), false);
  assert.equal(areSatelit("   "), false);
  assert.equal(areSatelit("cheie"), true);
});

test("plăcile satelit vin din serviciile ArcGIS cu cheie, cu atribuirea Esri", () => {
  assert.match(STRAT_SATELIT, /^https:\/\/ibasemaps-api\.arcgis\.com\/.*World_Imagery\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}$/);
  assert.match(STRAT_ETICHETE, /^https:\/\/static-map-tiles-api\.arcgis\.com\/.*arcgis\/imagery\/labels\/static\/tile\/\{z\}\/\{y\}\/\{x\}$/);
  assert.match(ATRIBUIRE_SATELIT, /Esri, Vantor, Earthstar Geographics/);
});
