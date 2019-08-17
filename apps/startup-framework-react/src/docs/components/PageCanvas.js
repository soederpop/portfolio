import React, { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import types from "prop-types";
import CanvasItem from './CanvasItem'
import { Button, Segment } from 'semantic-ui-react'

PageCanvas.propTypes = {
  renderItem: types.func.isRequired,
  onDrag: types.func,
  onDragStop: types.func,
  accept: types.string,
  source: types.string,
  name: types.string.isRequired,
  items: types.array,
  onUpdate: types.func,
  handleSave: types.func,
}

PageCanvas.defaultProps = {
  accept: "ITEM",
  source: "canvas",
  name: "canvas"
}

export default function PageCanvas(props = {}) {
  const { onUpdate, onDragStop, onDrag, name, source = name, accept = "ITEM", items: initial = [], renderItem } = props
  const [items, updateItems] = useState(initial);

  const move = useCallback(
    (dragIndex, hoverIndex) => {
      const dragCard = items[dragIndex]

      if (dragCard) {
        dragCard.order = hoverIndex
        items.splice(dragIndex, 1)  
        items.splice(hoverIndex, 0, dragCard)
        updateItems(items)
        onUpdate(items)
      }
    },
    [items],
  )

  const [{ canDrop, isOver }, drop] = useDrop({
    accept,
    drop: (item) => {
      if (item.source !== source) {
        const newItems = items.concat([{ type: accept, ...item, source, order: items.length }]) 
        updateItems(newItems)
        onUpdate(newItems)
      }
      onDragStop && onDragStop(item, this)
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = canDrop && isOver;

  const BlockControls = props.controls || (() => null)

  const handleSave = (newItems) => { 
    updateItems(newItems.map((name, order) => ({ name, order })))
  }

  return (
    <div ref={drop} style={{ height: '100%', width: '100%' }}>
      <Segment fluid basic secondary>
        {items.map((item, index) => 
          <CanvasItem key={index} onDragStop={onDragStop} onDrag={onDrag} move={move} order={index} name={item.name}>        
            {renderItem(({ 
              ...item, 
              updateItems, 
              items, 
              isActive, 
              index, 
              controls: (<BlockControls handleSave={handleSave} blocks={items.map(i => i.name)} name={item.name} />),
              order: index }))}
          </CanvasItem>
        )}
      </Segment>
    </div>
  );
}
