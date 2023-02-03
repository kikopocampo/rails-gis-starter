import React from "react";

const ResultList = props => {
  const {result} = props;
  console.log(result)
  const listedPlaces = result.map(el => {
    return <li key={el.properties.id}>{el.properties.name}</li>
  })
  return <ul>
    {listedPlaces}
  </ul>
}

export default ResultList