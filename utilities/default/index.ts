export function GetArtistName(name: string): string {
    // Reduces length of name for graphic poster
    switch(name) {
        case 'YoungBoy Never Broke Again':
           return 'NBA YoungBoy';

        case 'A Boogie wit da Hoodie':
            return 'A Boogie';

        case 'A Boogie Wit da Hoodie':
            return 'A Boogie';

        case 'Ski Mask The Slump God':
            return 'Ski Mask';

        default:
            return name;
    }
}