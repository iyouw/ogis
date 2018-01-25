
/**
 *
 * @param proj
 * @constructor
 */
function JurassicProjection(proj){
    this.proj = proj;
}
/**
 *
 * @param coor
 * @returns {*}
 */
JurassicProjection.prototype.toEPSG3857 = function(coor){
    return this.proj('EPSG:3857',coor);
};
