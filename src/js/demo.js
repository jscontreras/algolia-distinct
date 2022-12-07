/* global $, Hogan, algoliasearch, algoliasearchHelper */

$(document).ready(function () {
  // INITIALIZATION
  // ==============

  // Replace with your own values
  var APPLICATION_ID = 'latency';
  var SEARCH_ONLY_API_KEY = '6be0576ff61c053d5f9a3225e2a90f76';
  var INDEX_NAME = 'variants_color';
  var PARAMS = {
    hitsPerPage: 20
  };

  // Client + Helper initialization
  var algoliaClient = algoliasearch(APPLICATION_ID, SEARCH_ONLY_API_KEY);

  var algoliaHelper = algoliasearchHelper(algoliaClient, INDEX_NAME, PARAMS);


  var initSearch = algoliaClient.search;
  algoliaClient = {...algoliaClient, search(requests) {
    console.log('requests.length', requests.length)
    if (requests.length > 1) {
      return initSearch(requests);
    }
  }}



  // DOM BINDING
  var $searchInput = $('#search-input');
  var $searchInputIcon = $('#search-input-icon');
  var $main = $('main');
  var $hits = $('#hits');
  var $models = $('#hits-models');

  // Hogan templates binding
  var hitTemplate = Hogan.compile($('#hit-template').text());
  var noResultsTemplate = Hogan.compile($('#no-results-template').text());

  // MULTIQUERY DEMO
  function searchMultiquery() {
    // Sending multiple Queries
    const queries = [{
      indexName: algoliaHelper.getIndex(),
      ...algoliaHelper.getQuery(),
      analyticsTags: ['main-results'],
      ruleContexts: { // Adding context
        renderer: 'ModelsResults'
      },
    },
    {
      indexName: algoliaHelper.getIndex(),
      ...algoliaHelper.getQuery(),
      distinct: true, // Forcing Distinct
      ruleContexts: { // Adding context
        renderer: 'ModelsHeader'
      },
      analyticsTags: ['modelView'],
    }];


    algoliaClient.search(queries).then(({ results }) => {
      renderHits(results[0]);
      renderModels(results[1])
      handleNoResults(results[0]);
    });
  }
  function setMultiQuery(query) {
    toggleIconEmptyInput(query);
    $('#search-input').val(query);
    algoliaHelper.setQuery(query);
  }

  // SEARCH BINDING
  // ==============
  // Input binding
  $searchInput
    .on('keyup', function () {
      $('#query-message').empty();
      var query = $(this).val();
      toggleIconEmptyInput(query);
      setMultiQuery(query);
      searchMultiquery();
    })
    .focus();

  // Search results
  // algoliaHelper.on('result', function (content) {
  //   renderHits(content.results);
  //   handleNoResults(content.results);
  // });

  // Initial search
  searchMultiquery();

  // RENDER SEARCH COMPONENTS
  // ========================

  function renderHits(content) {
    $hits.html(hitTemplate.render(content));
  }
  function renderModels(content) {
    $models.html(hitTemplate.render(content));
  }

  // NO RESULTS
  // ==========

  function handleNoResults(content) {
    if (content.nbHits > 0) {
      $main.removeClass('no-results');
      return;
    }
    $main.addClass('no-results');
    $hits.html(noResultsTemplate.render({ query: content.query }));
  }

  // EVENTS BINDING
  // ==============

  $searchInputIcon.on('click', function (e) {
    e.preventDefault();
    $searchInput.val('').keyup().focus();
  });
  $(document).on('click', '.clear-all', function (e) {
    e.preventDefault();
    $searchInput.val('').focus();
    setMultiQuery('');
    searchMultiquery('');
  });
  $(document).on('click', '.set-distinct', function (e) {
    e.preventDefault();
    $('#query-message').empty();
    setDistinct($(this));
    searchMultiquery();
  });
  $(document).on('click', '.set-query', function (e) {
    e.preventDefault();
    $('#query-message').html($(this).data('message'));
    setDistinct($(".set-distinct[data-value='" + $(this).data('distinct') + "']"));
    setMultiQuery($(this).data('query'));
    searchMultiquery();
  });

  // HELPER METHODS
  // ==============

  function setDistinct(selector) {
    $('.set-distinct').removeClass('active');
    selector.addClass('active');
    $('#distinct-message').html(selector.data('message'));
    algoliaHelper.setQueryParameter('distinct', selector.data('value'));
  }
  // function setQuery(query) {
  //   toggleIconEmptyInput(query);
  //   $('#search-input').val(query);
  //   setMultiQuery(q);
  // }
  function toggleIconEmptyInput(query) {
    $searchInputIcon.toggleClass('empty', query.trim() !== '');
  }
});
