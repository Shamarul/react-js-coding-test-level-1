import "./App.css";
import { useState, useEffect, useLayoutEffect, createRef, useMemo } from "react";
import ReactLoading from "react-loading";
import axios from "axios";
import Modal from "react-modal";
import * as am5 from "@amcharts/amcharts5";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5xy from "@amcharts/amcharts5/xy";
import Pdf from "react-to-pdf";
import Pagination from './Pagination';

let PageSize = 5;

const ref = createRef();

function Bar(props) {

  let { pokemonDetail } = props
  //const chart = useRef(null);
  const chartID = props.chartID;
  console.log({ chartID });

  useLayoutEffect(() => {
    // Create root and chart

    let root = am5.Root.new(chartID);
    const myTheme = am5.Theme.new(root);
    myTheme.rule("Label").setAll({
      fill: am5.color(0xFFFFFF),
    });
    root.setThemes([
      am5themes_Animated.new(root),
      myTheme
    ]);

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/xy-chart/
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none"
      })
    );


    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 30 });

    let yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "stat",
        renderer: yRenderer
      })
    );

    let xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    );


    // Create series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Series 1",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        sequencedInterpolation: true,
        categoryYField: "stat"
      })
    );

    let columnTemplate = series.columns.template;

    columnTemplate.setAll({
      draggable: true,
      cursorOverStyle: "pointer",
      tooltipText: "drag to rearrange",
      cornerRadiusBR: 10,
      cornerRadiusTR: 10
    });
    columnTemplate.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    columnTemplate.adapters.add("stroke", (stroke, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    columnTemplate.events.on("dragstop", () => {
      sortCategoryAxis();
    });

    // Get series item by category
    function getSeriesItem(category) {
      for (var i = 0; i < series.dataItems.length; i++) {
        let dataItem = series.dataItems[i];
        if (dataItem.get("categoryY") == category) {
          return dataItem;
        }
      }
    }


    // Axis sorting
    function sortCategoryAxis() {
      // Sort by value
      series.dataItems.sort(function (x, y) {
        return y.get("graphics").y() - x.get("graphics").y();
      });

      let easing = am5.ease.out(am5.ease.cubic);

      // Go through each axis item
      am5.array.each(yAxis.dataItems, function (dataItem) {
        // get corresponding series item
        let seriesDataItem = getSeriesItem(dataItem.get("category"));

        if (seriesDataItem) {
          // get index of series data item
          let index = series.dataItems.indexOf(seriesDataItem);

          let column = seriesDataItem.get("graphics");

          // position after sorting
          let fy =
            yRenderer.positionToCoordinate(yAxis.indexToPosition(index)) -
            column.height() / 2;

          // set index to be the same as series data item index
          if (index != dataItem.get("index")) {
            dataItem.set("index", index);

            // current position
            let x = column.x();
            let y = column.y();

            column.set("dy", -(fy - y));
            column.set("dx", x);

            column.animate({ key: "dy", to: 0, duration: 600, easing: easing });
            column.animate({ key: "dx", to: 0, duration: 600, easing: easing });
          } else {
            column.animate({ key: "y", to: fy, duration: 600, easing: easing });
            column.animate({ key: "x", to: 0, duration: 600, easing: easing });
          }
        }
      });

      // Sort axis items by index.
      // This changes the order instantly, but as dx and dy is set and animated,
      // they keep in the same places and then animate to true positions.
      yAxis.dataItems.sort(function (x, y) {
        return x.get("index") - y.get("index");
      });
    }

    // Set data
    let data = [];

    pokemonDetail.stats.map((value, key) => {
      let obj = {};
      obj.stat = value?.stat?.name;
      obj.value = value?.base_stat;
      data.push(obj);
    });

    data.reverse();

    yAxis.data.setAll(data);
    series.data.setAll(data);


    // Make stuff animate on load
    // https://www.amcharts.com/docs/v5/concepts/animations/
    series.appear(1000);
    chart.appear(1000, 100);
  }, [chartID]);

  return <div style={{ width: "70%", height: "300px", minWidth: 500 }} id={chartID}></div>;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function PokemonList(props) {
  let { pokemons, setPokemonDetail, setIsLoading, filterSearch } = props
  console.log('filterSearch', filterSearch);
  function getPokemonDetails(url) {

    const fetchData = async () => {
      setIsLoading(true);
      axios.get(url)
        .then(function (response) {
          console.log(response?.data);
          setPokemonDetail(response?.data);
        })
        .catch(function (error) {
          console.log(error);
        })
    };

    fetchData();
    setIsLoading(false)
  }

  // let listing = pokemons.map((value, key) => {
  //   if(!value.name.indexOf(filterSearch)) {
  //     return (
  //       <div key={key} className="pokemonName" onClick={()=>{getPokemonDetails(value.url)}}>
  //         {value.name}
  //       </div>
  //     )
  //   } else {
  //     return null
  //   }
  // })

  let listing = pokemons.map((value, key) => (
    <div key={key} className="pokemonName" onClick={()=>{getPokemonDetails(value.url)}}>
      {value.name}
    </div>
  ))

  return listing;
}

function PokemonStats(props) {
  let { pokemonDetail } = props

  let stats = pokemonDetail.stats.map((value, key) => (
    <div key={key} style={{display: 'flex', justifyContent: 'space-between', width: 300}}>
      <div>
        {capitalizeFirstLetter(value?.stat?.name)}
      </div>
      <div>
        {value?.base_stat}
      </div>
    </div>
  ))

  return stats;
}

function PokeDex() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pokemons, setPokemons] = useState([]);
  const [filteredPokemons, setFilteredPokemon] =  useState([]);
  const [pokemonDetail, setPokemonDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  console.log('pokemonDetail', pokemonDetail);

  useEffect(() => {
    setIsLoading(true)
    const fetchData = async () => {
      axios.get('https://pokeapi.co/api/v2/pokemon')
        .then(function (response) {
          setPokemons(response?.data?.results);
          setFilteredPokemon(response?.data?.results);
          setCurrentPage(0)
          setCurrentPage(1)
        })
        .catch(function (error) {
          console.log(error);
        })
    };

    fetchData();
    setIsLoading(false)
  }, []);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    console.log('test', pokemons.slice(firstPageIndex, lastPageIndex));
    console.log(pokemons);
    return pokemons.slice(firstPageIndex, lastPageIndex);
  }, [currentPage]);


  const searchPokemon = (search) => {

    let data = [];

    pokemons.map((value, key) => {
      if(!value.name.indexOf(search)) {
        let obj = {};
        obj.name = value?.name;
        obj.url = value?.url;
        data.push(obj);
      }
    });

    data.reverse();

    setFilterSearch(search);
    setFilteredPokemon(data)

    console.log('data', data);
  }

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      background: "black",
      color: "white",
    },
    overlay: { backgroundColor: "grey" },
  };

  if (!isLoading && pokemons.length === 0) {
    return (
      <div>
        <header className="App-header">
          <h1>Welcome to pokedex !</h1>
          <h2>Requirement:</h2>
          <ul>
            <li>
              Call this api:https://pokeapi.co/api/v2/pokemon to get pokedex, and show a list of pokemon name.
            </li>
            <li>Implement React Loading and show it during API call</li>
            <li>when hover on the list item , change the item color to yellow.</li>
            <li>when clicked the list item, show the modal below</li>
            <li>
              Add a search bar on top of the bar for searching, search will run
              on keyup event
            </li>
            <li>Implement sorting and pagingation</li>
            <li>Commit your codes after done</li>
            <li>If you do more than expected (E.g redesign the page / create a chat feature at the bottom right). it would be good.</li>
          </ul>
        </header>
      </div>
    );
  }

  return (
    <div>
      <header className="App-header">
        {isLoading ? (
          <>
            <div className="App">
              <header className="App-header">
                <ReactLoading type={"balls"} color={"#fff"} height={667} width={375} />
              </header>
            </div>
          </>
        ) : (
          <>
            <h1>Welcome to pokedex !</h1>
            <div style={{paddingBottom: 20}}>
              <input placeholder="Search pokemon" type="text" name="filter" onChange={e => {searchPokemon(e.target.value);}}/>
            </div>
            <PokemonList pokemons={filterSearch?filteredPokemons:currentTableData} setPokemonDetail={setPokemonDetail} setIsLoading={setIsLoading} filterSearch={filterSearch} />
            <Pagination
              className="pagination-bar"
              currentPage={currentPage}
              totalCount={filteredPokemons.length}
              pageSize={PageSize}
              onPageChange={page => setCurrentPage(page)}
            />
          </>
        )}
      </header>
      {pokemonDetail && (
        <Modal
          isOpen={pokemonDetail}
          contentLabel={pokemonDetail?.name || ""}
          onRequestClose={() => {
            setPokemonDetail(null);
          }}
          style={customStyles}
        >
          <div ref={ref} align="center" style={{backgroundColor: 'black'}}>
            <div>
              {capitalizeFirstLetter(pokemonDetail.name)}
            </div>
            <div>
              <img src={pokemonDetail?.sprites?.front_default} />
            </div>
            <div>
              <PokemonStats pokemonDetail={pokemonDetail} />
            </div>
              <Bar chartID="bar" pokemonDetail={pokemonDetail} />
          </div>
          <div align="center" style={{padding: 10}}>
            <Pdf targetRef={ref} filename="code-example.pdf">
                {({ toPdf }) => <button style={{padding: 5}} onClick={toPdf}>Generate Pdf</button>}
            </Pdf>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PokeDex;
