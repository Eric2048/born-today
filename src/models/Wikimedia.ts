
// Support for calling Wikimedia's "On this day" API
// See: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day

export type WikimediaImage = {
  height: number;
  width:  number;
  source: string;
};

export type WikimediaOnThisDayResponse = {
  births: Array<
    { 
      text: string;  // e.g. "Frankie Jonas, American actor, singer, and songwriter"
      year: number;
      pages: Array<
        { 
          // Wikimedia's unique id for this page
          // see: https://www.mediawiki.org/wiki/Topic:Vrs064yd5abjwr71
          pageid: number;
          
          type: string;

          titles: {
            normalized: string; // e.g. "Frankie Jonas"
          }
          thumbnail?:     WikimediaImage;
          originalimage?: WikimediaImage;
          description:    string; // e.g. "American singer, actor, member of the Jonas Family (born 2000)"
        }
      >
    }
  >
};
