import React, { useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import types from "prop-types";

CanvasItem.propTypes = {
  children: types.element,
  accept: types.string,
  move: types.func,
  update: types.func,
  source: types.string,
  order: types.number,
  onDragStop: types.func,
  items: types.array
}

CanvasItem.defaultProps = {
  accept: 'ITEM',
  source: 'canvas',
  items: [],
}

export default function CanvasItem({ items, update, onDragStop, onDrag, accept, move, order, source, name, children }) {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.order;
      const hoverIndex = order;

      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      typeof move === "function" && move(dragIndex, hoverIndex, item);
    }
  });

  const item = source === "canvas" ? {} : { order };

  const [{ isDragging }, drag] = useDrag({
    begin() {
      onDrag({ ...item, name, type: accept, source, order }, this)
    },
    end(dropResult) {
      onDragStop && onDragStop({ ...item, name, type: accept, source, order })
    },
    item: { ...item, name, type: accept, source, order },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0.4 : 1;

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }}>
      {children}
    </div>
  )
}
