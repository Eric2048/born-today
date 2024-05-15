
import type { WikimediaImage } from "./Wikimedia";

export type Person = {
  // Unique id (source is Wikimedia's pageid, expressed here as a string with the prefix 'pageid-')
  id:       string;
  year:     number;

  // Unfortunately Wikimedia does not provide separate first/last name fields, just this.
  fullName: string; // e.g. "Frankie Jonas"
  
  description: string; // e.g. "American singer, actor, member of the Jonas Family (born 2000)"

  thumbnail: WikimediaImage;
  image:     WikimediaImage;

  // Derived fields, to improve filter/sort performance in <PeopleListView>
  fullNameLowercase:      string;
  lastNameGuessLowercase: string;
  descriptionLowercase:   string;  
};
