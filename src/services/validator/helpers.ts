import { AssetData, AssetConfig, DictionaryValue } from './types'; // type aliases or interfaces for the types
import { sha256 } from 'js-sha256'; // external library for sha256 hashing
import {beginCell, DictionaryValue, Slice} from "@ton/ton";
import {AssetConfig, AssetData} from "./types";
import crypto from "crypto";

const sha256Hash = (input: string): string => {
  return sha256(input);
};

const bigIntMin = (a: bigint, b: bigint): bigint => {
  return a < b ? a : b;
};

const bigIntMax = (a: bigint, b: bigint): bigint => {
  return a > b ? a : b;
};

export const createAssetData = (
  assetId: string,
  assetName: string,
  assetSymbol: string,
  assetDecimals: number,
  assetTotalSupply: bigint,
  assetOwner: string,
  assetUrl: string,
  assetMetadata: string
): AssetData => {
  const builder = Buffer.alloc(32 + 32 + 32 + 32 + 32 + 32 + 32 + 32); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  builder.write(assetName, 32, 32, 'utf8');
  builder.write(assetSymbol, 64, 32, 'utf8');
  builder.writeUInt8(assetDecimals, 96);
  builder.writeBigInt64BE(assetTotalSupply, 97);
  builder.write(assetOwner, 105, 32, 'hex');
  builder.write(assetUrl, 137, 32, 'utf8');
  builder.write(assetMetadata, 169, 32, 'utf8');
  return builder;
};

export const createAssetConfig = (
  assetId: string,
  assetFreeze: boolean,
  assetClawback: boolean,
  assetReserve: boolean,
  assetFreezeAddress: string,
  assetClawbackAddress: string,
  assetReserveAddress: string,
  assetManagerAddress: string,
  assetUnitName: string,
  assetName: string,
  assetUrl: string,
  assetMetadata: string,
  assetDecimals: number,
  assetDefaultFrozen: boolean,
  assetTotal: bigint
): AssetConfig => {
  const builder = Buffer.alloc(32 + 1 + 1 + 1 + 32 + 32 + 32 + 32 + 32 + 32 + 32 + 32 + 1 + 1 + 8); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  builder.writeUInt8(assetFreeze ? 1 : 0, 32);
  builder.writeUInt8(assetClawback ? 1 : 0, 33);
  builder.writeUInt8(assetReserve ? 1 : 0, 34);
  builder.write(assetFreezeAddress, 35, 32, 'hex');
  builder.write(assetClawbackAddress, 67, 32, 'hex');
  builder.write(assetReserveAddress, 99, 32, 'hex');
  builder.write(assetManagerAddress, 131, 32, 'hex');
  builder.write(assetUnitName, 163, 32, 'utf8');
  builder.write(assetName, 195, 32, 'utf8');
  builder.write(assetUrl, 227, 32, 'utf8');
  builder.write(assetMetadata, 259, 32, 'utf8');
  builder.writeUInt8(assetDecimals, 291);
  builder.writeUInt8(assetDefaultFrozen ? 1 : 0, 292);
  builder.writeBigInt64BE(assetTotal, 293);
  return builder;
};

export const dictionaryValueToBuffer = <T>(
  value: DictionaryValue<T>
): Buffer | undefined => {
  if (value.type === 'string') {
    const buffer = Buffer.alloc(32);
    buffer.write(value.value, 0, 32, 'utf8');
    return buffer;
  } else if (value.type === 'number') {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(value.value), 0);
    return buffer;
  } else if (value.type === 'boolean') {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value.value ? 1 : 0, 0);
    return buffer;
  } else if (value.type === 'bytes') {
    const buffer = Buffer.alloc(32);
    buffer.write(value.value, 0, 32, 'hex');
    return buffer;
  } else {
    return undefined;
  }
};

export const createDictionary = <T>(
  dictionary: Record<string, DictionaryValue<T>>
): Buffer => {
  const keys = Object.keys(dictionary);
  const values = Object.values(dictionary);
  const builder = Buffer.alloc(32 + 32 * keys.length + 32 * values.length); // descriptive variable name
  builder.writeUInt8(keys.length, 0);
  for (let i = 0; i < keys.length; i++) {
    builder.write(keys[i], 1 + i * 32, 32, 'utf8');
  }
  for (let i = 0; i < values.length; i++) {
    const valueBuffer = dictionaryValueToBuffer(values[i]);
    if (valueBuffer) {
      valueBuffer.copy(builder, 1 + keys.length * 32 + i * 32);
    }
  }
  return builder;
};

export const createAssetDictionary = (
  assetId: string,
  dictionary: Record<string, DictionaryValue<bigint | boolean | string>>
): Buffer => {
  const builder = Buffer.alloc(32 + 32 + 32 * 32); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  const dictionaryBuffer = createDictionary(dictionary);
  dictionaryBuffer.copy(builder, 32);
  return builder;
};

export const createAssetDictionaryReference = (
  assetId: string,
  referenceAssetId: string,
  referenceOffset: bigint,
  referenceBuilder: (value: bigint) => bigint
): Buffer => {
  const builder = Buffer.alloc(32 + 32 + 8 + 32); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  builder.write(referenceAssetId, 32, 32, 'hex');
  builder.writeBigInt64BE(referenceOffset, 64);
  const referenceValue = referenceBuilder(referenceOffset);
  builder.writeBigInt64BE(referenceValue, 72);
  return builder;
};

export const createAssetDictionaryReferences = (
  assetId: string,
  referenceAssetId: string,
  referenceOffsets: bigint[],
  referenceBuilder: (value: bigint) => bigint
): Buffer => {
  const builder = Buffer.alloc(32 + 32 + 32 + 32 * referenceOffsets.length); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  builder.write(referenceAssetId, 32, 32, 'hex');
  builder.writeUInt8(referenceOffsets.length, 64);
  for (let i = 0; i < referenceOffsets.length; i++) {
    const referenceOffset = referenceOffsets[i];
    builder.writeBigInt64BE(referenceOffset, 65 + i * 32);
    const referenceValue = referenceBuilder(referenceOffset);
    builder.writeBigInt64BE(referenceValue, 73 + i * 32);
  }
  return builder;
};

export const createAssetDictionaryReferenceRanges = (
  assetId: string,
  referenceAssetId: string,
  referenceRanges: [bigint, bigint][],
  referenceBuilder: (value: bigint) => bigint
): Buffer => {
  const builder = Buffer.alloc(32 + 32 + 32 + 32 * referenceRanges.length); // descriptive variable name
  builder.write(assetId, 0, 32, 'hex');
  builder.write(referenceAssetId, 32, 32, 'hex');
  builder.writeUInt8(referenceRanges.length, 64);
  for (let i = 0; i < referenceRanges.length; i++) {
    const referenceRange = referenceRanges[i];
    const referenceMin = bigIntMin(referenceRange[0], referenceRange[1]);
    const referenceMax = bigIntMax(referenceRange[0], referenceRange[1]);
    builder.writeBigInt64BE(referenceMin, 65 + i * 32);
    builder.writeBigInt64BE(referenceMax, 73 + i * 32);
    const referenceValue = referenceBuilder(referenceMin);
    builder.writeBigInt64BE(referenceValue, 81 + i * 32);
  }
  return builder;
};
