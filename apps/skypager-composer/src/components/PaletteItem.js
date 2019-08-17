import React from "react";
import { useDrag } from "react-dnd";
import types from "prop-types";

PaletteItem.propTypes = {
  name: types.string.isRequired,
  type: types.string
}

PaletteItem.defaultProps = {
  type: 'ITEM'
}

export default function PaletteItem({
  name,
  type,
  children
}) {

  const [{ isDragging }, drag] = useDrag({
    item: { name, type },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0.4 : 1;

  return (
    <span ref={drag} style={{ opacity }}>
      {children}
    </span>
  );
}
