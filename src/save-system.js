import { Block } from "/src/block.js";

export function exportBlocksToJSON() {
  const blocks = Block.blockList.map(b => {
    // read contents
    const contents = {};
    b.element.querySelectorAll(".content-item").forEach((el, i) => {
      const name = b.blockData.contents?.[i]?.name || `content_${i}`;
      contents[name] = el.value;
    });

    // construct block data
    return {
      id: b.id,
      type: b.blockData.name,
      x: parseFloat(b.element.style.left),
      y: parseFloat(b.element.style.top),
      contents
    };
  });

  // return formatted JSON
  return JSON.stringify({ blocks }, null, 2);
}

export function loadBlocksFromJSON(json) {
  const data = JSON.parse(json);

  data.blocks.forEach(b => {
    const blockDef = getBlockDefinitionByName(b.type); // from blocks.json
    const newBlock = new Block(blockDef);

    const el = newBlock.element;
    el.style.position = "absolute";
    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;

    // restore dropdowns/inputs
    el.querySelectorAll(".content-item").forEach((el, i) => {
      const name = blockDef.contents?.[i]?.name;
      if (name in b.contents) el.value = b.contents[name];
    });

    canvas.appendChild(el);
  });
}
