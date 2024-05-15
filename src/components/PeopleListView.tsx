
/*
  Example of using reactdatagrid:
    - Uses async data source fetch, but local filtering and sorting
    - Supports row selection, including keyboard navigation and persistence to redux store
*/


import { useState, useEffect, useCallback } from 'react';
import { MutableRefObject } from 'react'
// import Image from 'react-bootstrap/Image'

import ReactDataGrid                                   from '@inovua/reactdatagrid-community';
import { TypeColumn }                                  from '@inovua/reactdatagrid-community/types/TypeColumn';
import { TypeFilterValue }                             from '@inovua/reactdatagrid-community/types/TypeFilterValue';
import { TypeSortInfo, TypeSingleSortInfo }            from "@inovua/reactdatagrid-community/types/TypeSortInfo"
import { TypeComputedProps, TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps"
import StringFilter                                    from '@inovua/reactdatagrid-community/StringFilter';
import NumberFilter                                    from '@inovua/reactdatagrid-community/NumberFilter';
import '@inovua/reactdatagrid-community/index.css';

//------------------------------------------------------------------------------
// Models
import type { Person } from '../models/Person';

//------------------------------------------------------------------------------
// Services
import { useAppSelector, useAppDispatch } from '../services/redux/hooks'
import { selectAllPeople } from '../services/redux/peopleSlice'
import { SELECTED_PERSON_ID_NONE, selectSelectedPersonId, setSelectedPersonId } from '../services/redux/viewStateSlice'

//------------------------------------------------------------------------------
// <ReactDataGrid> Customizations

const filterValueDefault: TypeFilterValue = [
  // name:       id/name of column
  // type:       string id for column's filterEditor: StringFilter / DateFilter / SelectFilter
  // operator:   https://reactdatagrid.io/docs/filtering#filter-types-&-operators
  // value:      default value: null (for "All") or a specific value from the set
  // emptyValue: internal (not display) value to use to ignore the filter. Defaults to null.
  // active:     set to false to disable filter Dropdown for this column  
  { name: 'year', type: 'number', operator: 'eq', value: null, emptyValue: null },

  // Can't use a Custom Filter for a controlled ReactDataGrid, see https://github.com/inovua/reactdatagrid/issues/326
  // // This column requires a custom filter type, see 'nameAndDescriptionStringFilter' above.
  // { name: 'nameAndDescription', type: 'nameAndDescriptionStringFilter', operator: 'contains', value: null, emptyValue: null }

  { name: 'nameAndDescription', type: 'string', operator: 'contains', value: null, emptyValue: null }
];

// Note: can't use a Custom Filter for a controlled ReactDataGrid, see https://github.com/inovua/reactdatagrid/issues/326

// Note: ReactDataGrid only supports multi-column sort in uncontrolled mode.
const sortInfoDefault: TypeSingleSortInfo = { name: 'year', dir: 1 };

// After receiving the source data for this list, we will locally sort it.
const sort = (people: Array<Person>, sortInfo: TypeSingleSortInfo): Array<Person> => {
  return [ ...people ].sort((person1: Person, person2: Person) => {
    switch(sortInfo.name) {
      case 'nameAndDescription':
        return person1.lastNameGuessLowercase.localeCompare(person2.lastNameGuessLowercase) * sortInfo.dir;

        case 'year':
          return (person1.year - person2.year) * sortInfo.dir;

        default:
          // Future: other filter types
          return 0;
    }
  });
};

// After receiving the source data for this list, we will locally filter and sort it.
const filterAndSort = (people: Array<Person>, filterValue: TypeFilterValue, sortInfo: TypeSingleSortInfo): Array<Person> => {
  // Narrowing for TS
  if (filterValue) {
    const filterValueYear = filterValue.find((filter) => filter.name === 'year');
    const year: number | null = filterValueYear ? filterValueYear.value : null;
    // console.log(`filterAndSort(): year:`, year);

    const filterValueNameAndDescription = filterValue.find((filter) => filter.name === 'nameAndDescription');
    const nameAndDesc = filterValueNameAndDescription?.value?.toLowerCase() || null;
    // console.log(`filterAndSort(): filterValueNameAndDescription:`, filterValueNameAndDescription);
    // console.log(`filterAndSort(): nameAndDesc:`, nameAndDesc);

    const peopleFiltered = people.filter((person: Person) => {
      // Must pass both filters
      if ((year !== null) && (person.year !== year)) return false;

      // (For future i18n support will need to properly handle comparison of accented characters.)
      if ((nameAndDesc !== null) &&
          (person.fullNameLowercase.indexOf(nameAndDesc) === -1) &&
          (!person.descriptionLowercase || (person.descriptionLowercase.indexOf(nameAndDesc) === -1))) return false;
      return true;
    });
    // console.log(`filterAndSort(): post filter:`, peopleFiltered);
    
    const peopleFilteredAndSorted = sort(peopleFiltered, sortInfo);
    // console.log(`filterAndSort(): post sort:`, peopleFilteredAndSorted);
    return peopleFilteredAndSorted;
  }
  return [];
};

// Our two columns
const columns: Array<TypeColumn> = [
  { name:      'year',
    header:    'Born In',
    // Need 240 to fully support operators such as "In Range"
    minWidth:  120,
    maxWidth:  120,
    type:      'number',
    filterEditor: NumberFilter,
    filterEditorProps: {
      cancelButton: false,
      placeholder: "Year..."
    },

    // reactdatagrid docs disagree with their type definition, this is a supported property.
    // See https://reactdatagrid.io/docs/api-reference#props-renderColumnFilterContextMenu and TypeDataGridProps.d.ts
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    filterDelay: 1000, // Override 250ms default so Agent can enter a string without getting interrupted
    draggable: false, 
    render: ({ data }: { data: Person }) => data.year,
  },

  // Note: for proper sorting might need a custom scroll function, see https://reactdatagrid.io/docs/api-reference#props-columns-sort
  { name:      'nameAndDescription',
    header:    'Name',
    flex:      1, // Use the remaining width
    
    // Use the basic StringFilter entry field UX
    filterEditor: StringFilter,

    // reactdatagrid does not support Custom Filters for a controlled ReactDataGrid,
    // so using the standard string filter here, not our nameAndDescriptionStringFilter.
    type: 'string', 

    filterEditorProps: {
      cancelButton: false,
      placeholder: "Contains..."
    },

    // reactdatagrid docs disagree with their type definition, this is a supported property.
    // See https://reactdatagrid.io/docs/api-reference#props-renderColumnFilterContextMenu and TypeDataGridProps.d.ts
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    filterDelay: 1000, // Override 250ms default so Agent can enter a string without getting interrupted

    draggable: false,

    // Render this Person (name & description)
    // By default use 2 lines but at >=1200px arrange side-by-side.    d-xl-flex flex-xl-row gap-2 
    render: ({ data /*, rowIndex */ }: { data: Person /*, rowIndex: number*/ }) => (
      <div className="person-cell">
        <div className="fw-bold">{ data.fullName }</div>
        <div className="fst-italic">{ data.description }</div>
        {/* { (rowIndex < 100) && data.thumbnail && (
            <Image
              // Note: .img-fluid: { max-width: 100%; height: auto; }
              fluid src={ data.thumbnail.source } alt="Person thumbnail" className="rounded shadow person-view-image-tn"
            />
          )
        } */}
      </div>
    )
  }
];

//------------------------------------------------------------------------------
const PeopleListView = () => {
  const dispatch = useAppDispatch();

  // Get the full people list from redux
  const people = useAppSelector(selectAllPeople);

  // Get the currently selected personId according to our Redux store
  const selectedPersonId = useAppSelector(selectSelectedPersonId);

  //----------------------------------------------------------------------------
  // <ReactDataGrid> "controlled" properties, with standard naming.

  // Ref to the <ReactDataGrid> component for DOM access,
  // used by onSelectionChange() and other event handlers.
  const [ gridRef, setGridRef ] = useState<MutableRefObject<TypeComputedProps | null> | null>(null);

  // Sorted People list, to be displayed by <ReactDataGrid> in this order.
  const [ dataSource, setDataSource ] = useState(sort(people, sortInfoDefault));

  const [ filterValue, setFilterValue ] = useState<TypeFilterValue>(filterValueDefault);
  const [ sortInfo, setSortInfo ] = useState<TypeSingleSortInfo>(sortInfoDefault);

  //----------------------------------------------------------------------------
  // When People list arrives, if we have no persisted selection,
  // or its an illegal value, then select the first row by default.
  useEffect(() => {
    if (dataSource?.length &&
        ((selectedPersonId === SELECTED_PERSON_ID_NONE) ||
         (dataSource.findIndex((person: Person) => (person.id === selectedPersonId)) === -1))
    ) {
      // console.log(`PeopleListView(): defaulting selection to first row:`, dataSource[0]);
      dispatch(setSelectedPersonId(dataSource[0].id));
    }
  }, [ dispatch, dataSource, selectedPersonId ]);

  // When <ReactDataGrid> finishes rendering, if we have a selectedPersonId
  // then scroll to that row.
  useEffect(() => {
    if (gridRef?.current && dataSource && selectedPersonId) {
      // BUG: was using unsorted peopleIds [] to get row index
      // const index = peopleIds.findIndex((value: EntityId) => (value === selectedPersonId));

      // This is not in the ReactDataGrid docs but is supported.
      // const index = gridRef.current.getItemIndexById(selectedPersonId);
      // TODO-PERF keep an map of indexes by id.
      const index = dataSource.findIndex((person: Person) => person.id === selectedPersonId);

      if (index !== -1) {
        // console.log(`PeopleListView(): scrolling to index:`, index);
        gridRef.current.scrollToIndex(index);
      }
    }
  }, [ gridRef, dataSource, selectedPersonId ]);

  //----------------------------------------------------------------------------
  // Event Handlers -- for <ReactDataGrid> events
  //----------------------------------------------------------------------------
  /* OPTIONAL, from JH
  // There is no "rendering completed" notification, so instead monitor for
  // when the first row has rendered, and then set the <ReactDataGrid> column
  // filter input fields to readonly to prevent text entry in those fields.
  const onRenderRow = (rowProps: RowProps) => {
    // console.log(`Cases.onRenderRow()`, rowProps);

    // Originally tried this, but the last row won't be rendered if the
    // <ReactDataGrid> does not have sufficient height.
    // if (rowProps.last) {
  
    // Is this the first row?
    if (rowProps.data.id === rowProps.dataSourceArray[0].id) {
      // Yes
      const collection = document.getElementsByClassName('inovua-react-toolkit-combo-box__input');
      // console.log(`Cases.onRenderRow(): reached first row, setting <ReactDataGrid> column filter input fields to readonly`, collection, collection.length);
      Array.from(collection).forEach((el) => {
        el.setAttribute('readonly', 'true');
      });
    }
  };
  */
  
  //----------------------------------------------------------------------------
  // Selection support

  // When <ReactDataGrid> indicates a change to the selection, update our redux store.
  // Cache this function definition to avoid redundant re-rendering of <ReactDataGrid>.
  const onSelectionChange = useCallback(
    (selectionChange: TypeOnSelectionChangeArg) => {
      // console.log(`onSelectionChange(): setting selectedPersonId to:`, selectionChange.selected);
      // Must narrow this to treat as a string.
      if (typeof selectionChange.selected === 'string') {
        dispatch(setSelectedPersonId(selectionChange.selected));
      }
    },
    [ dispatch ]
  );

  //----------------------------------------------------------------------------
  // Support for local filtering/sorting

  // reactdatagrid's type defs assume we are using multiple sort columns
  // (TypeSortInfo) but we are in single column sort mode, so must cast to TypeSingleSortInfo.
  const onSortInfoChange = useCallback((sortInfoNew: TypeSortInfo) => {
    console.log(`onSortInfoChange(): sortInfoNew:`, JSON.stringify(sortInfoNew));

    // We are running <ReactDataGrid> in single-column sort mode, so must narrow
    // this argument to TypeSingleSortInfo.
    if (sortInfoNew && !(sortInfoNew instanceof Array)) {
      const peopleFilteredAndSorted = filterAndSort(people, filterValue, sortInfoNew);
      setDataSource(peopleFilteredAndSorted);
      setSortInfo(sortInfoNew as TypeSingleSortInfo);
      dispatch(setSelectedPersonId(SELECTED_PERSON_ID_NONE));
    }
  }, [ dispatch, filterValue, people ]);

  const onFilterValueChange = useCallback((filterValue: TypeFilterValue) => {
    console.log(`onFilterValueChange(): filterValue:`, JSON.stringify(filterValue));
    
    // BUG on their side. This is ignoring my custom filter, see their https://github.com/inovua/reactdatagrid/issues/326
    // (And can't use their filter() for a partial filter for some reason.)
    // const data = filter(people, filterValueNew);
    const peopleFilteredAndSorted = filterAndSort(people, filterValue, sortInfo);
    setDataSource(peopleFilteredAndSorted);
    setFilterValue(filterValue);
    dispatch(setSelectedPersonId(SELECTED_PERSON_ID_NONE));
  }, [ dispatch, sortInfo, people ]);

  //----------------------------------------------------------------------------
  // Detect arrow keys
  useEffect(() => {
    // DOM event handler can only accept the standard 'event' argument.
    // If need additional context, wrap this in a closure:
    // https://stackoverflow.com/questions/15088010/adding-and-removing-event-listeners-with-parameters
    const onKeyDown = (event: KeyboardEvent) => {    
      if (gridRef?.current) {
        // This is not in the ReactDataGrid docs but is supported.
        const i = gridRef.current.getItemIndexById(selectedPersonId);
        // console.log('onKeyDown(): current index:', i);
        if (event.code === 'ArrowUp') {      
          if (i > 0) {
            // console.log(`onKeyDown(): ArrowUp: was ${ i }`);
            dispatch(setSelectedPersonId(dataSource[i - 1].id));   
          }

        } else if (event.code === 'ArrowDown') {      
          if (i < (dataSource.length - 1)) {
            // console.log(`onKeyDown(): ArrowDown: was ${ i }`);          
            dispatch(setSelectedPersonId(dataSource[i + 1].id));   
          }
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      // To cleanup, must remove the exact same handler and { capture }.
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [ dispatch, gridRef, dataSource, selectedPersonId ]);

  //----------------------------------------------------------------------------
  return (
    <ReactDataGrid
      onReady={ setGridRef }
      className="h-100 people-list-grid"
      idProperty="id"

      // By setting these, we place this component is 'controlled' mode.
      columns={ columns }
      dataSource={ dataSource }

      // For fixed row height:
      // rowHeight={ 50 }

      // For expandable row height:
      // rowHeight={ null }
      // minRowHeight={ 30 }
      // maxRowHeight={ 100 }

      // This is a tough call because this menu provides access to operators such
      // as "In Range" which are great for a column showing Years, but to support
      // that this column would need to be twice as wide which looks bad.
      enableColumnFilterContextMenu={ false }

      //------------------------------------------------------------------------
      // Optional: enable this line to add the Pagination UX into the grid footer
      // pagination="local"

      //------------------------------------------------------------------------
      // Provide our extended set of FilterTypes (see const, above)
      // BUG on their side -- not supported with a controlled <ReactDataGrid> https://github.com/inovua/reactdatagrid/issues/326
      // filterTypes={ filterTypes }

      filterValue={ filterValue }
      onFilterValueChange={ onFilterValueChange }

      //------------------------------------------------------------------------
      // Enable local sorting, based on the Column.type and Column.sort function for each column.
      sortable

      // // This is a TypeSingleSortInfo ({} not [ {} ]) so only single-column sort
      // // is enabled, and default to sorting the 'year' column, ascending.
      // sortInfoDefault={ sortInfoDefault }
      
      // For the current sort column, only allow ascending and descending, not "none".
      allowUnsort={ false }
            
      sortInfo={ sortInfo }
      onSortInfoChange={ onSortInfoChange }

      //------------------------------------------------------------------------
      // Row Selection

      // Highlight a row on hover
      showHoverRows={ true }

      // Enable soft-selection via up/down arrows. Must still press Enter to select the row.
      enableKeyboardNavigation={ true }
      
      // Don't allow Enter to de-select a row
      toggleRowSelectOnClick={ false }
      
      activateRowOnFocus={ true }

      enableSelection= { true }
      selected={ selectedPersonId }
      onSelectionChange={ onSelectionChange }
    />
  );
};

export default PeopleListView;
