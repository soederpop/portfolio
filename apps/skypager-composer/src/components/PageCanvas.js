import React, { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import types from "prop-types";
import CanvasItem from './CanvasItem'

DropZone.propTypes = {
  renderItem: types.func.isRequired,
  accept: types.string,
  source: types.string,
  name: types.string.isRequired,
  items: types.array
}

DropZone.defaultProps = {
  accept: "ITEM",
  source: "canvas",
  name: "canvas"
}

export default function DropZone(props = {}) {
  const { name, source = name, accept = "ITEM", items: initial = [], renderItem } = props
  const [items, updateItems] = useState(initial);

  const move = useCallback(
    (dragIndex, hoverIndex) => {
      const dragCard = items[dragIndex]

      if (dragCard) {
        dragCard.order = hoverIndex
        items.splice(dragIndex, 1)  
        items.splice(hoverIndex, 0, dragCard)
        updateItems(items)
      }
    },
    [items],
  )

  const [{ canDrop, isOver }, drop] = useDrop({
    accept,
    drop: (item) => {
      if (item.source !== source) {
        updateItems(items.concat([{ type: accept, ...item, source, order: items.length }]))
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = canDrop && isOver;

  return (
    <div ref={drop}>
      {items.map((item, index) => 
        <CanvasItem move={move} order={index} name={item.name}>        
          {renderItem(({ ...item, index }))}
        </CanvasItem>
      )}
    </div>
  );
}
